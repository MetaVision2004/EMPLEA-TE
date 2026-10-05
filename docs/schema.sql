-- ============================================
-- Emplea-TE: Schema de base de datos (Supabase/Postgres)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Perfiles extendidos (auth.users ya lo maneja Supabase Auth)
create table if not exists perfiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text,
  rol text not null default 'candidato' check (rol in ('candidato', 'empresa', 'staff', 'admin')),
  ciudad text,
  nivel_educativo text,
  habilidades text[],
  bio text,
  telefono text,
  linkedin_url text,
  portfolio_url text,
  foto_url text,
  created_at timestamp with time zone default now()
);

alter table perfiles add column if not exists rol text not null default 'candidato';
alter table perfiles add column if not exists telefono text;
alter table perfiles add column if not exists linkedin_url text;
alter table perfiles add column if not exists portfolio_url text;
alter table perfiles drop constraint if exists perfiles_rol_check;
alter table perfiles add constraint perfiles_rol_check check (rol in ('candidato', 'empresa', 'staff', 'admin'));

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
  owner_id uuid references auth.users(id) on delete set null,
  nombre text not null,
  sector text,
  ciudad text,
  logo_url text
);

alter table empresas add column if not exists owner_id uuid references auth.users(id) on delete set null;
create unique index if not exists empresas_owner_id_unique on empresas(owner_id) where owner_id is not null;

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
  estado_personal text not null default 'aplicado' check (estado_personal in ('aplicado', 'entrevista', 'oferta', 'rechazado')),
  notas text,
  created_at timestamp with time zone default now(),
  unique (usuario_id, oferta_id)
);

alter table postulaciones add column if not exists estado_personal text;
update postulaciones set estado_personal = estado where estado_personal is null;
alter table postulaciones alter column estado_personal set default 'aplicado';
alter table postulaciones alter column estado_personal set not null;

-- Recursos educativos
create table if not exists recursos (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  tipo text check (tipo in ('articulo', 'video', 'curso')),
  url text,
  categoria text,
  nivel text,
  descripcion text,
  duracion text
);

alter table recursos add column if not exists descripcion text;
alter table recursos add column if not exists duracion text;

create table if not exists recursos_completados (
  usuario_id uuid references auth.users(id) on delete cascade,
  recurso_id uuid references recursos(id) on delete cascade,
  completed_at timestamp with time zone default now(),
  primary key (usuario_id, recurso_id)
);

-- Mentores voluntarios y solicitudes de agenda
create table if not exists mentores (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  especialidad text not null,
  bio text,
  disponible boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists sesiones_mentoria (
  id uuid default gen_random_uuid() primary key,
  mentor_id uuid references mentores(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete cascade,
  fecha timestamp with time zone not null,
  tema text not null,
  estado text default 'solicitada' check (estado in ('solicitada', 'confirmada', 'cancelada')),
  created_at timestamp with time zone default now()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table perfiles enable row level security;
alter table empresas enable row level security;
alter table ofertas enable row level security;
alter table experiencias enable row level security;
alter table postulaciones enable row level security;
alter table recursos enable row level security;
alter table recursos_completados enable row level security;
alter table mentores enable row level security;
alter table sesiones_mentoria enable row level security;

-- El backend consulta este rol con service_role. La función permite que el
-- cliente también aplique RLS a las operaciones administrativas autorizadas.
create or replace function public.has_profile_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = any(required_roles)
  );
$$;

-- Perfiles: cada quien ve y edita solo el suyo
drop policy if exists "select_propio_perfil" on perfiles;
create policy "select_propio_perfil" on perfiles
  for select using (auth.uid() = id);

drop policy if exists "insert_propio_perfil" on perfiles;
create policy "insert_propio_perfil" on perfiles
  for insert with check (auth.uid() = id and rol = 'candidato');

drop policy if exists "update_propio_perfil" on perfiles;
create policy "update_propio_perfil" on perfiles
  for update using (auth.uid() = id);

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and new.rol is distinct from old.rol
     and not public.has_profile_role(array['admin']) then
    raise exception 'No puedes cambiar tu rol';
  end if;
  return new;
end;
$$;

drop trigger if exists perfiles_no_rol_change on public.perfiles;
create trigger perfiles_no_rol_change
  before update on public.perfiles
  for each row execute function public.prevent_role_change();

-- Los datos de empresas son públicos; solo admin/staff pueden mantenerlos
-- hasta que exista una relación explícita entre una cuenta y su empresa.
drop policy if exists "empresas_publicas" on empresas;
create policy "empresas_publicas" on empresas
  for select using (true);

drop policy if exists "insert_empresas_admin_staff" on empresas;
create policy "insert_empresas_admin_staff" on empresas
  for insert with check (public.has_profile_role(array['admin', 'staff']));

drop policy if exists "update_empresas_admin_staff" on empresas;
create policy "update_empresas_admin_staff" on empresas
  for update using (public.has_profile_role(array['admin', 'staff']))
  with check (public.has_profile_role(array['admin', 'staff']));

drop policy if exists "delete_empresas_admin_staff" on empresas;
create policy "delete_empresas_admin_staff" on empresas
  for delete using (public.has_profile_role(array['admin', 'staff']));

drop policy if exists "ofertas_activas_publicas" on ofertas;
create policy "ofertas_activas_publicas" on ofertas
  for select using (activa = true);

drop policy if exists "select_ofertas_gestionables" on ofertas;
create policy "select_ofertas_gestionables" on ofertas
  for select using (
    public.has_profile_role(array['admin', 'staff'])
    or exists (
      select 1 from public.empresas e
      where e.id = ofertas.empresa_id and e.owner_id = auth.uid()
    )
  );

drop policy if exists "insert_ofertas_gestionables" on ofertas;
create policy "insert_ofertas_gestionables" on ofertas
  for insert with check (
    public.has_profile_role(array['admin', 'staff'])
    or (
      public.has_profile_role(array['empresa'])
      and exists (
        select 1 from public.empresas e
        where e.id = ofertas.empresa_id and e.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "update_ofertas_gestionables" on ofertas;
create policy "update_ofertas_gestionables" on ofertas
  for update using (
    public.has_profile_role(array['admin', 'staff'])
    or exists (
      select 1 from public.empresas e
      where e.id = ofertas.empresa_id and e.owner_id = auth.uid()
    )
  ) with check (
    public.has_profile_role(array['admin', 'staff'])
    or exists (
      select 1 from public.empresas e
      where e.id = ofertas.empresa_id and e.owner_id = auth.uid()
    )
  );

drop policy if exists "delete_ofertas_gestionables" on ofertas;
create policy "delete_ofertas_gestionables" on ofertas
  for delete using (
    public.has_profile_role(array['admin', 'staff'])
    or exists (
      select 1 from public.empresas e
      where e.id = ofertas.empresa_id and e.owner_id = auth.uid()
    )
  );

create or replace function public.enforce_owned_company_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nombre_empresa text;
begin
  if public.has_profile_role(array['empresa']) then
    select nombre into nombre_empresa
    from public.empresas
    where id = new.empresa_id and owner_id = auth.uid();
    if nombre_empresa is null then
      raise exception 'La oferta debe pertenecer a tu empresa vinculada';
    end if;
    new.empresa := nombre_empresa;
  end if;
  return new;
end;
$$;

drop trigger if exists ofertas_nombre_empresa_protegido on public.ofertas;
create trigger ofertas_nombre_empresa_protegido
  before insert or update on public.ofertas
  for each row execute function public.enforce_owned_company_name();

create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  total_perfiles bigint;
  completos bigint;
  entrevistas bigint;
begin
  if not public.has_profile_role(array['admin', 'staff']) then
    raise exception 'No tienes permisos para consultar la analítica';
  end if;

  select count(*), count(*) filter (
    where nombre is not null and btrim(nombre) <> ''
      and ciudad is not null and btrim(ciudad) <> ''
      and nivel_educativo is not null and btrim(nivel_educativo) <> ''
      and habilidades is not null and cardinality(habilidades) > 0
  ) into total_perfiles, completos
  from public.perfiles;

  select count(*) into entrevistas
  from public.postulaciones where estado = 'entrevista';

  return jsonb_build_object(
    'perfiles', jsonb_build_object('total', total_perfiles, 'completos', completos),
    'postulaciones', jsonb_build_object('entrevista', entrevistas)
  );
end;
$$;

revoke all on function public.admin_stats() from public;
grant execute on function public.admin_stats() to authenticated;

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
drop policy if exists "select_propias_experiencias" on experiencias;
create policy "select_propias_experiencias" on experiencias
  for select using (auth.uid() = perfil_id);

drop policy if exists "insert_propias_experiencias" on experiencias;
create policy "insert_propias_experiencias" on experiencias
  for insert with check (auth.uid() = perfil_id);

drop policy if exists "update_propias_experiencias" on experiencias;
create policy "update_propias_experiencias" on experiencias
  for update using (auth.uid() = perfil_id) with check (auth.uid() = perfil_id);

drop policy if exists "delete_propias_experiencias" on experiencias;
create policy "delete_propias_experiencias" on experiencias
  for delete using (auth.uid() = perfil_id);

-- Postulaciones: el candidato inicia el proceso, la empresa actualiza el estado oficial
drop policy if exists "select_propias_postulaciones" on postulaciones;
create policy "select_propias_postulaciones" on postulaciones
  for select using (auth.uid() = usuario_id);

drop policy if exists "insert_propias_postulaciones" on postulaciones;
create policy "insert_propias_postulaciones" on postulaciones
  for insert with check (auth.uid() = usuario_id and estado = 'aplicado');

drop policy if exists "update_propias_postulaciones" on postulaciones;
create policy "update_propias_postulaciones" on postulaciones
  for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists "select_postulaciones_gestionables" on postulaciones;
create policy "select_postulaciones_gestionables" on postulaciones
  for select using (
    public.has_profile_role(array['admin', 'staff'])
    or exists (
      select 1 from public.ofertas o
      join public.empresas e on e.id = o.empresa_id
      where o.id = postulaciones.oferta_id and e.owner_id = auth.uid()
    )
  );

drop policy if exists "update_postulaciones_gestionables" on postulaciones;
create policy "update_postulaciones_gestionables" on postulaciones
  for update using (
    public.has_profile_role(array['admin', 'staff'])
    or exists (
      select 1 from public.ofertas o
      join public.empresas e on e.id = o.empresa_id
      where o.id = postulaciones.oferta_id and e.owner_id = auth.uid()
    )
  ) with check (
    public.has_profile_role(array['admin', 'staff'])
    or exists (
      select 1 from public.ofertas o
      join public.empresas e on e.id = o.empresa_id
      where o.id = postulaciones.oferta_id and e.owner_id = auth.uid()
    )
  );

create or replace function public.prevent_candidate_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not public.has_profile_role(array['admin', 'staff']) then
      new.estado := 'aplicado';
    end if;
    return new;
  end if;

  if (new.usuario_id is distinct from old.usuario_id
      or new.oferta_id is distinct from old.oferta_id
      or new.created_at is distinct from old.created_at)
     and not public.has_profile_role(array['admin', 'staff']) then
    raise exception 'No puedes cambiar la identidad de la postulación';
  end if;

  if new.estado is distinct from old.estado
     and not public.has_profile_role(array['admin', 'staff'])
     and not exists (
       select 1 from public.ofertas o
       join public.empresas e on e.id = o.empresa_id
       where o.id = new.oferta_id and e.owner_id = auth.uid()
     ) then
    raise exception 'Solo la empresa responsable puede cambiar el estado oficial';
  end if;
  return new;
end;
$$;

drop trigger if exists postulaciones_estado_oficial_protegido on public.postulaciones;
create trigger postulaciones_estado_oficial_protegido
  before insert or update on public.postulaciones
  for each row execute function public.prevent_candidate_status_change();

drop policy if exists "recursos_publicos" on recursos;
create policy "recursos_publicos" on recursos
  for select using (true);

drop policy if exists "select_recursos_completados" on recursos_completados;
create policy "select_recursos_completados" on recursos_completados
  for select using (auth.uid() = usuario_id);

drop policy if exists "insert_recursos_completados" on recursos_completados;
create policy "insert_recursos_completados" on recursos_completados
  for insert with check (auth.uid() = usuario_id);

drop policy if exists "delete_recursos_completados" on recursos_completados;
create policy "delete_recursos_completados" on recursos_completados
  for delete using (auth.uid() = usuario_id);

drop policy if exists "mentores_disponibles_publicos" on mentores;
create policy "mentores_disponibles_publicos" on mentores
  for select using (disponible = true);

drop policy if exists "select_propias_sesiones" on sesiones_mentoria;
create policy "select_propias_sesiones" on sesiones_mentoria
  for select using (auth.uid() = usuario_id);

drop policy if exists "insert_propias_sesiones" on sesiones_mentoria;
create policy "insert_propias_sesiones" on sesiones_mentoria
  for insert with check (auth.uid() = usuario_id);

drop policy if exists "update_propias_sesiones" on sesiones_mentoria;
drop policy if exists "select_sesiones_admin_staff" on sesiones_mentoria;
create policy "select_sesiones_admin_staff" on sesiones_mentoria
  for select using (public.has_profile_role(array['admin', 'staff']));

drop policy if exists "update_sesiones_admin_staff" on sesiones_mentoria;
create policy "update_sesiones_admin_staff" on sesiones_mentoria
  for update using (public.has_profile_role(array['admin', 'staff']))
  with check (public.has_profile_role(array['admin', 'staff']));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'ofertas'
     ) then
    alter publication supabase_realtime add table public.ofertas;
  end if;
end;
$$;

-- Retira permisos heredados sin límite de propiedad sobre ofertas.
drop policy if exists "ofertas_gestion_select" on ofertas;
drop policy if exists "ofertas_gestion_insert" on ofertas;
drop policy if exists "ofertas_gestion_update" on ofertas;
drop policy if exists "ofertas_gestion_delete" on ofertas;

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
