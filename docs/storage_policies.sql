-- ============================================
-- Emplea-TE: Políticas de Storage
-- Requiere haber creado el bucket "documentos" (privado) en Supabase Storage
-- Estructura de archivos: documentos/{usuario_id}/cv.pdf
-- ============================================

-- Permitir subir su propio archivo
drop policy if exists "usuarios_suben_su_cv" on storage.objects;
create policy "usuarios_suben_su_cv"
on storage.objects for insert
with check (
  bucket_id = 'documentos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir ver/descargar su propio archivo
drop policy if exists "usuarios_ven_su_cv" on storage.objects;
create policy "usuarios_ven_su_cv"
on storage.objects for select
using (
  bucket_id = 'documentos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir actualizar (reemplazar) su propio archivo
drop policy if exists "usuarios_actualizan_su_cv" on storage.objects;
create policy "usuarios_actualizan_su_cv"
on storage.objects for update
using (
  bucket_id = 'documentos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir eliminar su propio archivo
drop policy if exists "usuarios_eliminan_su_cv" on storage.objects;
create policy "usuarios_eliminan_su_cv"
on storage.objects for delete
using (
  bucket_id = 'documentos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
