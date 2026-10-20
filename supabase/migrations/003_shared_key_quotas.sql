-- Apply after 001 and 002. Only shared-key calls consume these allowances.
begin;
create table if not exists public.cvats_shared_policy (
 id boolean primary key default true check(id),
 daily_limit integer not null default 100 check(daily_limit between 0 and 1000000),
 default_monthly_limit integer not null default 10 check(default_monthly_limit between 0 and 1000000)
);
insert into public.cvats_shared_policy(id) values(true) on conflict do nothing;
create table if not exists public.cvats_shared_user_limits (
 user_id uuid primary key references auth.users(id) on delete cascade,
 monthly_limit integer not null check(monthly_limit between 0 and 1000000)
);
alter table public.cvats_shared_policy enable row level security;
alter table public.cvats_shared_user_limits enable row level security;
revoke all on public.cvats_shared_policy,public.cvats_shared_user_limits from public,anon,authenticated,service_role;
create index if not exists cvats_shared_created on public.cvats_usage_runs(created_at) where key_source='shared';

create or replace function public.cvats_set_shared_policy(p_daily integer,p_monthly integer)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_daily is null or p_monthly is null or p_daily not between 0 and 1000000 or p_monthly not between 0 and 1000000 then raise exception 'CVATS_INVALID'; end if;
 update public.cvats_shared_policy set daily_limit=p_daily,default_monthly_limit=p_monthly where id=true;
end $$;

-- NULL removes the override and follows the current site default.
create or replace function public.cvats_set_quota(p_user uuid,p_limit integer)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.cvats_shared_policy where id=true for update;
 if not exists(select 1 from auth.users where id=p_user and raw_app_meta_data->>'cvats'='true') then raise exception 'CVATS_NOT_FOUND'; end if;
 if p_limit is null then delete from public.cvats_shared_user_limits where user_id=p_user;
 else
  if p_limit not between 0 and 1000000 then raise exception 'CVATS_INVALID'; end if;
  insert into public.cvats_shared_user_limits(user_id,monthly_limit) values(p_user,p_limit)
  on conflict(user_id) do update set monthly_limit=excluded.monthly_limit;
 end if;
end $$;

create or replace function public.cvats_shared_allowance(p_user uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'limit',coalesce(q.monthly_limit,p.default_monthly_limit),
  'override',q.monthly_limit,'defaultLimit',p.default_monthly_limit,
  'used',(select coalesce(sum(charged_calls),0) from public.cvats_usage_runs where user_id=p_user and key_source='shared' and budget_month=date_trunc('month',now() at time zone 'UTC')::date),
  'dailyLimit',p.daily_limit,
  'dailyUsed',(select coalesce(sum(charged_calls),0) from public.cvats_usage_runs where key_source='shared' and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'),
  'resetAt',(date_trunc('month',now() at time zone 'UTC')+interval '1 month') at time zone 'UTC',
  'dailyResetAt',(date_trunc('day',now() at time zone 'UTC')+interval '1 day') at time zone 'UTC')
 from public.cvats_shared_policy p left join public.cvats_shared_user_limits q on q.user_id=p_user where p.id=true;
$$;

create or replace function public.cvats_begin_run(p_user uuid,p_mode text,p_model text,p_source text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_cost integer; v_allowance jsonb;
begin
 if p_mode is null or p_model is null or p_source is null or p_mode not in ('scan','optimize') or p_model !~ '^gemini-[a-zA-Z0-9.-]+$' or p_source not in ('shared','personal') then raise exception 'CVATS_INVALID'; end if;
 if not exists(select 1 from auth.users where id=p_user and raw_app_meta_data->>'cvats'='true' and raw_app_meta_data->>'enabled'='true' and raw_app_meta_data->>'cvats_role' in ('admin','member') and coalesce(raw_app_meta_data->>'must_change_password','false')='false') then raise exception 'CVATS_FORBIDDEN'; end if;
 v_cost:=case when p_mode='optimize' then 2 else 1 end;
 if p_source='shared' then
  -- Every admission and policy update takes the same lock. Reservations count
  -- immediately, including concurrent requests and processes that crash.
  perform 1 from public.cvats_shared_policy where id=true for update;
  if not found then raise exception 'CVATS_INVALID'; end if;
  v_allowance:=public.cvats_shared_allowance(p_user);
  if (v_allowance->>'used')::bigint+v_cost>(v_allowance->>'limit')::integer then raise exception 'CVATS_USER_QUOTA'; end if;
  if (v_allowance->>'dailyUsed')::bigint+v_cost>(v_allowance->>'dailyLimit')::integer then raise exception 'CVATS_GLOBAL_QUOTA'; end if;
 end if;
 insert into public.cvats_usage_runs(user_id,model,mode,reserved_calls,charged_calls,key_source)
 values(p_user,p_model,p_mode,v_cost,v_cost,p_source) returning id into v_id;
 return v_id;
end $$;

-- New deployments use a new RPC name: missing migration fails closed instead
-- of silently calling the unlimited implementation from migration 002.
create or replace function public.cvats_admit_run(p_user uuid,p_mode text,p_model text,p_source text)
returns uuid language sql security definer set search_path='' as $$
 select public.cvats_begin_run(p_user,p_mode,p_model,p_source);
$$;
revoke all on function public.cvats_admit_run(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.cvats_admit_run(uuid,text,text,text) to service_role;

-- Legacy reserve RPC still delegates to begin_run and cannot bypass quotas.
-- Preserve the original statistics, enrich them with current shared allowances.
create or replace function public.cvats_user_usage(p_users uuid[]) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
  'userId',u.id,'attempted',coalesce(s.attempted,0),'tokens',coalesce(s.tokens,0),
  'unknownCalls',coalesce(s.unknown,0),'sharedCalls',coalesce(s.shared_calls,0),
  'personalCalls',coalesce(s.personal_calls,0),'sharedTokens',coalesce(s.shared_tokens,0),
  'personalTokens',coalesce(s.personal_tokens,0),'pending',coalesce(s.pending,0),
  'hasPersonalKey',exists(select 1 from public.cvats_personal_keys k where k.user_id=u.id),
  'quota',public.cvats_shared_allowance(u.id),
  'month',date_trunc('month',now() at time zone 'UTC')::date)), '[]'::jsonb)
 from auth.users u left join lateral (
  select sum(c.attempted) as attempted,sum(c.tokens) as tokens,sum(c.unknown) as unknown,
   sum(c.attempted) filter(where r.key_source='shared') as shared_calls,
   sum(c.attempted) filter(where r.key_source='personal') as personal_calls,
   sum(c.tokens) filter(where r.key_source='shared') as shared_tokens,
   sum(c.tokens) filter(where r.key_source='personal') as personal_tokens,
   count(*) filter(where r.status='pending') as pending
  from public.cvats_usage_runs r left join lateral(
   select count(*) as attempted,coalesce(sum(total_tokens),0) as tokens,
    count(*) filter(where total_tokens is null) as unknown
   from public.cvats_usage_calls where run_id=r.id
  )c on true where r.user_id=u.id and r.budget_month=date_trunc('month',now() at time zone 'UTC')::date
 )s on true where u.id=any(p_users);
$$;

create or replace function public.cvats_admin_usage() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'quota',public.cvats_shared_allowance(null),
 'models',coalesce((select jsonb_agg(t) from (
  select r.model,r.key_source as source,coalesce(sum(c.attempted),0) as attempted,
   coalesce(sum(c.tokens),0) as tokens,sum(c.prompt) as prompt,sum(c.output) as output,
   sum(c.thought) as thought,coalesce(sum(c.unknown),0) as unknown,
   count(*) filter(where r.status='pending') as pending,count(*) filter(where r.status='failed') as failed
  from public.cvats_usage_runs r left join lateral(
   select count(*) as attempted,sum(total_tokens) as tokens,sum(prompt_tokens) as prompt,
    sum(output_tokens) as output,sum(thought_tokens) as thought,
    count(*) filter(where total_tokens is null) as unknown
   from public.cvats_usage_calls where run_id=r.id
  )c on true where r.budget_month=date_trunc('month',now() at time zone 'UTC')::date
  group by r.model,r.key_source order by r.key_source,r.model
 )t),'[]'::jsonb),'month',date_trunc('month',now() at time zone 'UTC')::date);
$$;
revoke all on function public.cvats_set_shared_policy(integer,integer),public.cvats_set_quota(uuid,integer),public.cvats_shared_allowance(uuid),public.cvats_begin_run(uuid,text,text,text),public.cvats_user_usage(uuid[]),public.cvats_admin_usage() from public,anon,authenticated;
grant execute on function public.cvats_set_shared_policy(integer,integer),public.cvats_set_quota(uuid,integer),public.cvats_shared_allowance(uuid),public.cvats_begin_run(uuid,text,text,text),public.cvats_user_usage(uuid[]),public.cvats_admin_usage() to service_role;
notify pgrst,'reload schema';
commit;
