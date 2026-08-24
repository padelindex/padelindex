-- ============================================================
-- Avatar-Upload: Storage-Bucket, RLS, players.avatar_url
-- ============================================================

-- ------------------------------------------------------------
-- 1. players.avatar_url
-- ------------------------------------------------------------
alter table players add column if not exists avatar_url text;

grant update (avatar_url) on table players to authenticated;

-- ------------------------------------------------------------
-- 2. Storage-Bucket "avatars" (öffentlich lesbar)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true,
  2097152,  -- 2 MiB, serverseitige Spiegelung des Client-Limits
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 3. RLS auf storage.objects
-- ------------------------------------------------------------
-- Objekt-Pfad-Konvention innerhalb des Buckets: {auth.uid()}/profile.<ext>
-- storage.foldername(name) liefert die Pfad-Segmente vor dem Dateinamen,
-- also ist (storage.foldername(name))[1] die User-ID im ersten Segment.
-- Fester Dateiname pro User -> Re-Upload überschreibt einfach, keine
-- verwaisten alten Dateien, Cache-Busting über ?v=timestamp auf der URL.

create policy avatars_public_read
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy avatars_owner_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_owner_update
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_owner_delete
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
