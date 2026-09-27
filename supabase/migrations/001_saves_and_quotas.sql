-- CV-ATS 1.2 — execute this complete file in the Supabase SQL Editor.
-- No CV is saved automatically. Application accounting contains no CV text.
begin;
create table if not exists public.cvats_saved_cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  cv text not null check (char_length(cv) between 30 and 40000),
  job text not null default '' check (char_length(job) <= 30000),
  result jsonb check (result is null or octet_length(result::text) <= 250000),
  created_at timestamptz not null default now()
);
create index if not exists cvats_saved_owner on public.cvats_saved_cvs(user_id, created_at desc);
create table if not exists public.cvats_quota_settings (
  id boolean primary key default true check (id),
  daily_limit integer not null default 100 check (daily_limit between 0 and 1000000)
);
insert into public.cvats_quota_settings(id) values (true) on conflict do nothing;
create table if not exists public.cvats_user_quotas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_limit integer not null default 100 check (monthly_limit between 0 and 1000000)
);
create table if not exists public.cvats_usage_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  model text not null,
  mode text not null check (mode in ('scan','optimize')),
  reserved_calls integer not null check (reserved_calls between 1 and 2),
  charged_calls integer not null check (charged_calls between 0 and 2),
  budget_day date not null default (now() at time zone 'America/Los_Angeles')::date,
  budget_month date not null default date_trunc('month',now() at time zone 'UTC')::date,
  status text not null default 'pending' check (status in ('pending','succeeded','failed')),
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);
create index if not exists cvats_usage_month on public.cvats_usage_runs(user_id,budget_month);
create index if not exists cvats_usage_day on public.cvats_usage_runs(budget_day);
create table if not exists public.cvats_usage_calls (
  run_id uuid not null references public.cvats_usage_runs(id) on delete cascade,
  ordinal integer not null check (ordinal between 1 and 2),
  started_at timestamptz not null default now(),
  reported_at timestamptz,
  http_status integer,
  prompt_tokens bigint check (prompt_tokens >= 0),
  output_tokens bigint check (output_tokens >= 0),
  thought_tokens bigint check (thought_tokens >= 0),
  total_tokens bigint check (total_tokens >= 0),
  primary key (run_id,ordinal)
);

-- Even direct Supabase REST access with an old token cannot read saved CVs.
create or replace function public.cvats_can_access() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from auth.users u where u.id=auth.uid()
   and u.raw_app_meta_data->>'cvats'='true'
   and u.raw_app_meta_data->>'enabled'='true'
   and u.raw_app_meta_data->>'cvats_role' in ('admin','member')
   and coalesce(u.raw_app_meta_data->>'must_change_password','false')='false'
   and u.raw_app_meta_data->>'access_version' is not null
   and u.raw_app_meta_data->>'access_version'=auth.jwt()->'app_metadata'->>'access_version');
$$;
revoke all on function public.cvats_can_access() from public,anon;
grant execute on function public.cvats_can_access() to authenticated;

alter table public.cvats_saved_cvs enable row level security;
alter table public.cvats_quota_settings enable row level security;
alter table public.cvats_user_quotas enable row level security;
alter table public.cvats_usage_runs enable row level security;
alter table public.cvats_usage_calls enable row level security;
revoke all on public.cvats_saved_cvs,public.cvats_quota_settings,public.cvats_user_quotas,public.cvats_usage_runs,public.cvats_usage_calls from anon,authenticated;
grant select,delete on public.cvats_saved_cvs to authenticated;
grant all on public.cvats_saved_cvs,public.cvats_quota_settings,public.cvats_user_quotas,public.cvats_usage_runs,public.cvats_usage_calls to service_role;
drop policy if exists cvats_saved_read on public.cvats_saved_cvs;
create policy cvats_saved_read on public.cvats_saved_cvs for select to authenticated
 using(user_id=auth.uid() and (select public.cvats_can_access()));
drop policy if exists cvats_saved_delete on public.cvats_saved_cvs;
create policy cvats_saved_delete on public.cvats_saved_cvs for delete to authenticated
 using(user_id=auth.uid() and (select public.cvats_can_access()));

create or replace function public.cvats_save_cv(p_name text,p_cv text,p_job text,p_result jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
 if not public.cvats_can_access() then raise exception 'CVATS_FORBIDDEN'; end if;
 -- Serialize saves for this user, including direct parallel RPC requests.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,71));
 if (select count(*) from public.cvats_saved_cvs where user_id=auth.uid())>=20
 then raise exception 'CVATS_SAVE_LIMIT'; end if;
 insert into public.cvats_saved_cvs(user_id,name,cv,job,result)
 values(auth.uid(),trim(p_name),p_cv,p_job,p_result) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.cvats_save_cv(text,text,text,jsonb) from public,anon;
grant execute on function public.cvats_save_cv(text,text,text,jsonb) to authenticated;

-- Reservation is one transaction. The settings row serializes all admissions.
-- Pending reservations remain charged on crashes: a crash cannot bypass quota.
create or replace function public.cvats_reserve(p_user uuid,p_mode text,p_model text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_daily integer; v_monthly integer; v_cost integer; v_id uuid;
begin
 if p_mode not in ('scan','optimize') or p_model !~ '^gemini-[a-zA-Z0-9.-]+$'
 then raise exception 'CVATS_INVALID'; end if;
 v_cost:=case when p_mode='optimize' then 2 else 1 end;
 select daily_limit into strict v_daily from public.cvats_quota_settings where id=true for update;
 if not exists(select 1 from auth.users where id=p_user
   and raw_app_meta_data->>'cvats'='true' and raw_app_meta_data->>'enabled'='true'
   and raw_app_meta_data->>'cvats_role' in ('admin','member')
   and coalesce(raw_app_meta_data->>'must_change_password','false')='false')
 then raise exception 'CVATS_FORBIDDEN'; end if;
 insert into public.cvats_user_quotas(user_id) values(p_user) on conflict do nothing;
 select monthly_limit into v_monthly from public.cvats_user_quotas where user_id=p_user;
 if (select coalesce(sum(charged_calls),0) from public.cvats_usage_runs
     where user_id=p_user and budget_month=date_trunc('month',now() at time zone 'UTC')::date)+v_cost>v_monthly
 then raise exception 'CVATS_USER_QUOTA'; end if;
 if (select coalesce(sum(charged_calls),0) from public.cvats_usage_runs
     where budget_day=(now() at time zone 'America/Los_Angeles')::date)+v_cost>v_daily
 then raise exception 'CVATS_GLOBAL_QUOTA'; end if;
 if (select coalesce(sum(reserved_calls),0) from public.cvats_usage_runs
     where user_id=p_user and created_at>now()-interval '60 seconds')+v_cost>6
 then raise exception 'CVATS_RATE_LIMIT'; end if;
 insert into public.cvats_usage_runs(user_id,model,mode,reserved_calls,charged_calls)
 values(p_user,p_model,p_mode,v_cost,v_cost) returning id into v_id;
 return v_id;
end $$;

create or replace function public.cvats_start_call(p_run uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_run public.cvats_usage_runs; v_ordinal integer;
begin
 select * into strict v_run from public.cvats_usage_runs where id=p_run for update;
 if v_run.status<>'pending' or v_run.created_at<now()-interval '5 minutes'
 then raise exception 'CVATS_INVALID'; end if;
 select count(*)+1 into v_ordinal from public.cvats_usage_calls where run_id=p_run;
 if v_ordinal>v_run.reserved_calls then raise exception 'CVATS_INVALID'; end if;
 insert into public.cvats_usage_calls(run_id,ordinal) values(p_run,v_ordinal);
 return v_ordinal;
end $$;

create or replace function public.cvats_record_call(p_run uuid,p_ordinal integer,p_status integer,p_prompt bigint,p_output bigint,p_thought bigint,p_total bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
 update public.cvats_usage_calls set reported_at=now(),http_status=p_status,
 prompt_tokens=p_prompt,output_tokens=p_output,thought_tokens=p_thought,total_tokens=p_total
 where run_id=p_run and ordinal=p_ordinal and reported_at is null;
end $$;

create or replace function public.cvats_finish(p_run uuid,p_success boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
 perform 1 from public.cvats_usage_runs where id=p_run for update;
 update public.cvats_usage_runs set
 charged_calls=(select count(*) from public.cvats_usage_calls where run_id=p_run),
 status=case when p_success then 'succeeded' else 'failed' end, finalized_at=now()
 where id=p_run and status='pending';
end $$;

create or replace function public.cvats_set_quota(p_user uuid,p_limit integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
 perform 1 from public.cvats_quota_settings where id=true for update;
 if not exists(select 1 from auth.users where id=p_user and raw_app_meta_data->>'cvats'='true') then raise exception 'CVATS_NOT_FOUND'; end if;
 insert into public.cvats_user_quotas(user_id,monthly_limit) values(p_user,p_limit)
 on conflict(user_id) do update set monthly_limit=excluded.monthly_limit;
end $$;

create or replace function public.cvats_user_usage(p_users uuid[]) returns jsonb
language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
 'userId',u.id,'limit',coalesce(q.monthly_limit,100),'used',coalesce(s.used,0),
 'attempted',coalesce(s.attempted,0),'tokens',coalesce(s.tokens,0),'unknownCalls',coalesce(s.unknown,0),
 'month',date_trunc('month',now() at time zone 'UTC')::date,
 'resetAt',(date_trunc('month',now() at time zone 'UTC')+interval '1 month') at time zone 'UTC')), '[]'::jsonb)
 from auth.users u left join public.cvats_user_quotas q on q.user_id=u.id
 left join lateral (
   select sum(r.charged_calls) as used,sum(c.attempted) as attempted,sum(c.tokens) as tokens,sum(c.unknown) as unknown
   from public.cvats_usage_runs r left join lateral(
     select count(*) as attempted,coalesce(sum(total_tokens),0) as tokens,count(*) filter(where total_tokens is null) as unknown
     from public.cvats_usage_calls where run_id=r.id
   )c on true where r.user_id=u.id and r.budget_month=date_trunc('month',now() at time zone 'UTC')::date
 )s on true where u.id=any(p_users);
$$;

create or replace function public.cvats_admin_usage() returns jsonb
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object(
 'dailyLimit',(select daily_limit from public.cvats_quota_settings where id=true),
 'day',(now() at time zone 'America/Los_Angeles')::date,
 'resetAt',(((now() at time zone 'America/Los_Angeles')::date+1)::timestamp at time zone 'America/Los_Angeles'),
 'dailyUsed',(select coalesce(sum(charged_calls),0) from public.cvats_usage_runs where budget_day=(now() at time zone 'America/Los_Angeles')::date),
 'models',coalesce((select jsonb_agg(t) from (
  select r.model,coalesce(sum(r.charged_calls),0) as charged,
   coalesce(sum(c.attempted),0) as attempted,coalesce(sum(c.tokens),0) as tokens,
   sum(c.prompt) as prompt,sum(c.output) as output,sum(c.thought) as thought,
   coalesce(sum(c.unknown),0) as unknown,
   count(*) filter(where r.status='pending') as pending,
   count(*) filter(where r.status='failed') as failed
  from public.cvats_usage_runs r left join lateral(
   select count(*) as attempted,sum(total_tokens) as tokens,sum(prompt_tokens) as prompt,
    sum(output_tokens) as output,sum(thought_tokens) as thought,count(*) filter(where total_tokens is null) as unknown
   from public.cvats_usage_calls where run_id=r.id
  )c on true where r.budget_month=date_trunc('month',now() at time zone 'UTC')::date group by r.model
 )t),'[]'::jsonb), 'month',date_trunc('month',now() at time zone 'UTC')::date);
$$;

-- Accounting functions must NEVER be callable with a browser/anon user token.
revoke all on function public.cvats_reserve(uuid,text,text),public.cvats_start_call(uuid),public.cvats_record_call(uuid,integer,integer,bigint,bigint,bigint,bigint),public.cvats_finish(uuid,boolean),public.cvats_set_quota(uuid,integer),public.cvats_user_usage(uuid[]),public.cvats_admin_usage() from public,anon,authenticated;
grant execute on function public.cvats_reserve(uuid,text,text),public.cvats_start_call(uuid),public.cvats_record_call(uuid,integer,integer,bigint,bigint,bigint,bigint),public.cvats_finish(uuid,boolean),public.cvats_set_quota(uuid,integer),public.cvats_user_usage(uuid[]),public.cvats_admin_usage() to service_role;
notify pgrst,'reload schema';
commit;
