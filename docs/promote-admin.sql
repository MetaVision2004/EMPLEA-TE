-- Promueve la cuenta principal de administración.
-- Ejecutar en el SQL Editor de Supabase después de crear la cuenta.
insert into public.perfiles (id, nombre, rol)
select id, coalesce(raw_user_meta_data->>'nombre', email), 'admin'
from auth.users
where lower(email) = lower('serjegomare@gmail.com')
on conflict (id) do update
set rol = 'admin';

-- Verificación
select u.email, p.rol
from auth.users u
join public.perfiles p on p.id = u.id
where lower(u.email) = lower('serjegomare@gmail.com');
