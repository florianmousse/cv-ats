-- CV-ATS 1.3: apply AFTER 001_saves_and_quotas.sql, including on new projects.
-- Keeps accounts, CVs and historical consumption. Removes ALL app AI quotas.
begin;
create table if not exists public.cvats_personal_keys (
 user_id uuid primary key references auth.users(id) on delete cascade,
 encrypted_key text not null check (char_length(encrypted_key) between 30 and 4000),
 key_hint text not null check (char_length(key_hint)=4),
 model text not null default '' check (model='' or (char_length(model)<=100 and model ~ '^gemini-[a-zA-Z0-9.-]+$')),
 updated_at timestamptz not null default now()
);
alter table public.cvats_personal_keys enable row level security;
revoke all on public.cvats_personal_keys from public,anon,authenticated;
grant all on public.cvats_personal_keys to service_role;
-- No browser role can read even the ciphertext. Only private server routes.
alter table public.cvats_usage_runs add column if not exists key_source text not null default 'shared'
 check (key_source in ('shared','personal'));

create or replace function public.cvats_begin_run(p_user uuid,p_mode text,p_model text,p_source text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_cost integer;
begin
 if p_mode not in ('scan','optimize') or p_model !~ '^gemini-[a-zA-Z0-9.-]+$' or p_source not in ('shared','personal')
 then raise exception 'CVATS_INVALID'; end if;
 if not exists(select 1 from auth.users where id=p_user
   and raw_app_meta_data->>'cvats'='true' and raw_app_meta_data->>'enabled'='true'
   and raw_app_meta_data->>'cvats_role' in ('admin','member')
   and coalesce(raw_app_meta_data->>'must_change_password','false')='false')
 then raise exception 'CVATS_FORBIDDEN'; end if;
 -- These legacy columns now describe a single workflow (scan or optimize).
 -- They are NOT an allowance: no daily/monthly/minute limits or admission lock.
 v_cost:=case when p_mode='optimize' then 2 else 1 end;
 insert into public.cvats_usage_runs(user_id,model,mode,reserved_calls,charged_calls,key_source)
 values(p_user,p_model,p_mode,v_cost,v_cost,p_source) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.cvats_begin_run(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.cvats_begin_run(uuid,text,text,text) to service_role;

-- Old deployments calling the old function also lose their internal caps.
-- Keep this compatibility wrapper until all deployments have been upgraded.
create or replace function public.cvats_reserve(p_user uuid,p_mode text,p_model text)
returns uuid language sql security definer set search_path = '' as $$
 select public.cvats_begin_run(p_user,p_mode,p_model,'shared');
$$;
create or replace function public.cvats_set_quota(p_user uuid,p_limit integer)
returns void language plpgsql security definer set search_path = '' as $$
begin raise exception 'CVATS_QUOTAS_REMOVED'; end $$;
revoke all on function public.cvats_set_quota(uuid,integer) from public,anon,authenticated,service_role;
-- Keep old settings for migration history, but no client or server can edit them.
revoke all on public.cvats_user_quotas,public.cvats_quota_settings from public,anon,authenticated,service_role;

create or replace function public.cvats_user_usage(p_users uuid[]) returns jsonb
language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
  'userId',u.id,'attempted',coalesce(s.attempted,0),'tokens',coalesce(s.tokens,0),
  'unknownCalls',coalesce(s.unknown,0),'sharedCalls',coalesce(s.shared_calls,0),
  'personalCalls',coalesce(s.personal_calls,0),'sharedTokens',coalesce(s.shared_tokens,0),
  'personalTokens',coalesce(s.personal_tokens,0),'pending',coalesce(s.pending,0),
  'hasPersonalKey',exists(select 1 from public.cvats_personal_keys k where k.user_id=u.id),
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
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object(
 'models',coalesce((select jsonb_agg(t) from (
  select r.model,r.key_source as source,coalesce(sum(c.attempted),0) as attempted,
   coalesce(sum(c.tokens),0) as tokens,sum(c.prompt) as prompt,sum(c.output) as output,
   sum(c.thought) as thought,coalesce(sum(c.unknown),0) as unknown,
   count(*) filter(where r.status='pending') as pending,
   count(*) filter(where r.status='failed') as failed
  from public.cvats_usage_runs r left join lateral(
   select count(*) as attempted,sum(total_tokens) as tokens,sum(prompt_tokens) as prompt,
    sum(output_tokens) as output,sum(thought_tokens) as thought,
    count(*) filter(where total_tokens is null) as unknown
   from public.cvats_usage_calls where run_id=r.id
  )c on true where r.budget_month=date_trunc('month',now() at time zone 'UTC')::date
  group by r.model,r.key_source order by r.key_source,r.model
 )t),'[]'::jsonb), 'month',date_trunc('month',now() at time zone 'UTC')::date);
$$;
-- CREATE OR REPLACE preserves ACLs; make them explicit on a re-run as well.
revoke all on function public.cvats_reserve(uuid,text,text),public.cvats_user_usage(uuid[]),public.cvats_admin_usage() from public,anon,authenticated;
grant execute on function public.cvats_reserve(uuid,text,text),public.cvats_user_usage(uuid[]),public.cvats_admin_usage() to service_role;
notify pgrst,'reload schema';
commit;
