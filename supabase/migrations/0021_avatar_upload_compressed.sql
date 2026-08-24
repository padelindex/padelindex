-- ============================================================
-- Avatar-Upload: Bucket-Grenzen an clientseitige Kompression anpassen
-- ============================================================
-- AvatarUpload.svelte komprimiert seit dieser Version jedes Bild
-- clientseitig (Canvas + toBlob(), siehe src/lib/image-compression.ts)
-- auf max. 1024px Kantenlänge und ~500KB, bevor es überhaupt hochgeladen
-- wird — PNG-Uploads kommen dadurch nie mehr am Bucket an, es wird
-- ausschließlich WebP oder (Fallback ohne WebP-Encoding-Unterstützung
-- im Browser) JPEG erzeugt. allowed_mime_types entsprechend verengt,
-- file_size_limit als Sicherheitsnetz mit Headroom über dem 500KB-Ziel
-- belassen statt exakt draufgesetzt.

update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/webp'],
       file_size_limit = 1048576  -- 1 MiB, Sicherheitsnetz über dem 500KB-Ziel
 where id = 'avatars';
