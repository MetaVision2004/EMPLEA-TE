-- Permite que visitantes y usuarios autenticados vean las ofertas activas.
alter table public.ofertas enable row level security;

drop policy if exists "ofertas_activas_publicas" on public.ofertas;
create policy "ofertas_activas_publicas" on public.ofertas
  for select
  using (activa = true);
