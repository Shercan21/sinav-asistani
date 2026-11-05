-- Preserve account ownership, compare-and-swap revision protection and existing grants.
-- 40001 is reserved for retryable database serialization failures, not stale app revisions.
begin;
set local lock_timeout = '5s';
create or replace function public.save_teacher_records(expected_revision bigint, new_document jsonb)
returns setof public.teacher_records
language plpgsql
security definer
set search_path to ''
as $function$
declare
  current_user_id uuid := auth.uid();
  affected integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if expected_revision = 0 then
    insert into public.teacher_records(user_id, document)
    values (current_user_id, new_document) on conflict do nothing;
  else
    update public.teacher_records
    set document = new_document, revision = revision + 1, updated_at = now()
    where user_id = current_user_id and revision = expected_revision;
  end if;
  get diagnostics affected = row_count;
  if affected = 0 then
    raise sqlstate 'PT409' using message = 'SYNC_CONFLICT';
  end if;
  return query select * from public.teacher_records where user_id = current_user_id;
end;
$function$;
commit;
