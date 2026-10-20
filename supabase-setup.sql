-- Supabase SQL Editor: run once for Sınav Asistanı.
-- No service-role key is needed by the application.
create table if not exists public.teacher_records (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1,
  document jsonb not null,
  updated_at timestamptz not null default now(),
  constraint document_is_object check (jsonb_typeof(document) = 'object'),
  constraint document_size check (octet_length(document::text) <= 10485760)
);
alter table public.teacher_records enable row level security;
revoke all on public.teacher_records from anon, authenticated;
grant select on public.teacher_records to authenticated;
drop policy if exists own_records on public.teacher_records;
create policy own_records on public.teacher_records for select to authenticated
  using ((select auth.uid()) = user_id);

-- Compare revisions so an older device cannot overwrite newer records.
create or replace function public.save_teacher_records(expected_revision bigint, new_document jsonb)
returns setof public.teacher_records
language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); affected integer;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if expected_revision = 0 then
    insert into public.teacher_records(user_id, document)
      values (current_user_id, new_document) on conflict do nothing;
  else
    update public.teacher_records set document = new_document,
      revision = revision + 1, updated_at = now()
      where user_id = current_user_id and revision = expected_revision;
  end if;
  get diagnostics affected = row_count;
  if affected = 0 then raise exception 'SYNC_CONFLICT' using errcode = '40001'; end if;
  return query select * from public.teacher_records where user_id = current_user_id;
end;
$$;
revoke all on function public.save_teacher_records(bigint,jsonb) from public, anon;
grant execute on function public.save_teacher_records(bigint,jsonb) to authenticated;

-- Paper images/PDFs are private and isolated by account folder.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('exam-papers','exam-papers',false,15728640,
  array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
drop policy if exists own_paper_files on storage.objects;
create policy own_paper_files on storage.objects for all to authenticated
using (bucket_id = 'exam-papers' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'exam-papers' and (storage.foldername(name))[1] = (select auth.uid())::text);
