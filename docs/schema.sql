-- ============================================
-- Emplea-TE: Schema de base de datos (Supabase/Postgres)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Perfiles extendidos (auth.users ya lo maneja Supabase Auth)
create table if not exists perfiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text,
  ciudad text,
  nivel_educativo text,
  habilidades text[],
  bio text,
  foto_url text,
  created_at timestamp with time zone default now()
);

-- Experiencia laboral/educativa
create table if not exists experiencias (
  id uuid default gen_random_uuid() primary key,
  perfil_id uuid references perfiles(id) on delete cascade,
  tipo text check (tipo in ('educacion', 'laboral', 'voluntariado')),
  institucion text,
  cargo text,
  fecha_inicio date,
  fecha_fin date,
  descripcion text
);

-- Empresas que publican ofertas
create table if not exists empresas (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  sector text,
  ciudad text,
  logo_url text
);

-- Ofertas de empleo
create table if not exists ofertas (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references empresas(id),
  empresa text, -- nombre libre si no está normalizado aún
  titulo text not null,
  descripcion text,
  requisitos text,
  ciudad text,
  modalidad text check (modalidad in ('presencial', 'remoto', 'hibrido')),
  salario_rango text,
  activa boolean default true,
  created_at timestamp with time zone default now()
);

-- Postulaciones de usuarios a ofertas
create table if not exists postulaciones (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references auth.users(id) on delete cascade,
  oferta_id uuid references ofertas(id) on delete cascade,
  estado text default 'aplicado' check (estado in ('aplicado', 'entrevista', 'oferta', 'rechazado')),
  notas text,
  created_at timestamp with time zone default now(),
  unique (usuario_id, oferta_id)
);

-- Recursos educativos
create table if not exists recursos (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  tipo text check (tipo in ('articulo', 'video', 'curso')),
  url text,
  categoria text,
  nivel text
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table perfiles enable row level security;
alter table experiencias enable row level security;
alter table postulaciones enable row level security;

-- Perfiles: cada quien ve y edita solo el suyo
drop policy if exists "select_propio_perfil" on perfiles;
create policy "select_propio_perfil" on perfiles
  for select using (auth.uid() = id);

drop policy if exists "insert_propio_perfil" on perfiles;
create policy "insert_propio_perfil" on perfiles
  for insert with check (auth.uid() = id);

drop policy if exists "update_propio_perfil" on perfiles;
create policy "update_propio_perfil" on perfiles
  for update using (auth.uid() = id);

-- Trigger para crear perfil automáticamente al registrarse en auth.users (evita error RLS al crear cuenta)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, nombre)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Experiencias: solo el dueño del perfil asociado
create policy "select_propias_experiencias" on experiencias
  for select using (auth.uid() = perfil_id);

create policy "insert_propias_experiencias" on experiencias
  for insert with check (auth.uid() = perfil_id);

-- Postulaciones: solo el dueño
create policy "select_propias_postulaciones" on postulaciones
  for select using (auth.uid() = usuario_id);

create policy "insert_propias_postulaciones" on postulaciones
  for insert with check (auth.uid() = usuario_id);

-- Ofertas y recursos quedan públicos de lectura (no requieren RLS restrictivo)
-- pero puedes activarlo igual si quieres controlar quién inserta ofertas.

-- ============================================
-- Datos de prueba (opcional, para probar el MVP)
-- ============================================

insert into ofertas (titulo, empresa, ciudad, modalidad, descripcion, requisitos)
values
  ('Auxiliar administrativo', 'Comercial Andina', 'Barranquilla', 'presencial',
   'Apoyo en tareas administrativas y atención al cliente.', 'Bachiller, manejo básico de Excel'),
  ('Practicante de marketing digital', 'AgenciaViva', 'Bogotá', 'remoto',
   'Apoyo en redes sociales y campañas digitales.', 'Estudiante de mercadeo o afines'),
  ('Cajero/a', 'SuperMercados del Norte', 'Barranquilla', 'presencial',
   'Atención en caja y manejo de efectivo.', 'Bachiller, disponibilidad de horario');
