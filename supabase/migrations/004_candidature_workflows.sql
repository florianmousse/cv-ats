-- Apply after 003. Preserve existing reservations and shared quotas.
begin;
alter table public.cvats_usage_runs drop constraint if exists cvats_usage_runs_mode_check;
alter table public.cvats_usage_runs add constraint cvats_usage_runs_mode_check check (mode in ('scan','optimize','structure','letter'));
create or replace function public.cvats_begin_run(p_user uuid,p_mode text,p_model text,p_source text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_cost integer; v_allowance jsonb;
begin
 if p_mode is null or p_model is null or p_source is null or p_mode not in ('scan','optimize','structure','letter') or p_model !~ '^gemini-[a-zA-Z0-9.-]+$' or p_source not in ('shared','personal') then raise exception 'CVATS_INVALID'; end if;
 if not exists(select 1 from auth.users where id=p_user and raw_app_meta_data->>'cvats'='true' and raw_app_meta_data->>'enabled'='true' and raw_app_meta_data->>'cvats_role' in ('admin','member') and coalesce(raw_app_meta_data->>'must_change_password','false')='false') then raise exception 'CVATS_FORBIDDEN'; end if;
 v_cost:=case when p_mode='scan' then 1 else 2 end;
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


revoke all on function public.cvats_begin_run(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.cvats_begin_run(uuid,text,text,text) to service_role;
commit;
