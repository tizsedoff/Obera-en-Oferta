-- Obera en Oferta: cobro a negocios (planes y ofertas destacadas) con Mercado Pago.
-- Se aplica primero en STAGING. Los precios son de EJEMPLO: se cambian con UPDATE sobre public.planes.

-- 1) Planes y extras (configurable, sin tocar código)
create table if not exists public.planes (
  id text primary key,
  tipo text not null check (tipo in ('plan', 'extra')),
  nombre text not null,
  descripcion text,
  precio_ars numeric(12,2) not null check (precio_ars >= 0),
  duracion_dias int check (duracion_dias is null or duracion_dias > 0),
  max_ofertas_activas int check (max_ofertas_activas is null or max_ofertas_activas >= 0), -- solo tipo 'plan'
  activo boolean not null default true,
  orden int not null default 0
);

insert into public.planes (id, tipo, nombre, descripcion, precio_ars, duracion_dias, max_ofertas_activas, orden) values
  ('gratis',       'plan',  'Gratis', 'Empezá a publicar sin costo', 0, null, 2, 1),
  ('pro',          'plan',  'Pro',    'Más ofertas activas al mismo tiempo (30 días)', 9900, 30, 15, 2),
  ('destacada_3d', 'extra', 'Oferta destacada 3 días', 'Tu oferta aparece primero y con distintivo', 2900, 3, null, 3),
  ('destacada_7d', 'extra', 'Oferta destacada 7 días', 'Tu oferta aparece primero y con distintivo', 4900, 7, null, 4)
on conflict (id) do nothing;

alter table public.planes enable row level security;
drop policy if exists "planes_select_activos" on public.planes;
create policy "planes_select_activos" on public.planes for select to anon, authenticated using (activo);

-- 2) Estado del plan en cada negocio y destacado en cada oferta
alter table public.negocios
  add column if not exists plan_id text not null default 'gratis' references public.planes(id),
  add column if not exists plan_vence_at timestamptz;

alter table public.ofertas
  add column if not exists destacada_hasta timestamptz;

-- 3) Pagos: solo el servidor (service key) escribe y lee; sin políticas = nadie más accede
create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  plan_id text not null references public.planes(id),
  oferta_id uuid references public.ofertas(id) on delete set null,
  monto_ars numeric(12,2) not null check (monto_ars > 0),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobado', 'rechazado', 'cancelado', 'reembolsado')),
  mp_preference_id text,
  mp_payment_id text unique,
  mp_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  aprobado_at timestamptz
);
create index if not exists pagos_negocio_idx on public.pagos (negocio_id, created_at desc);
alter table public.pagos enable row level security;

-- 4) Aplica un pago aprobado UNA sola vez (idempotente) y otorga el plan o el destacado
create or replace function public.aplicar_pago_aprobado(p_pago_id uuid, p_mp_payment_id text, p_mp_status text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  pg public.pagos;
  pl public.planes;
begin
  select * into pg from public.pagos where id = p_pago_id for update;
  if not found or pg.estado = 'aprobado' then
    return false;
  end if;

  select * into pl from public.planes where id = pg.plan_id;

  update public.pagos
     set estado = 'aprobado', mp_payment_id = p_mp_payment_id, mp_status = p_mp_status,
         aprobado_at = now(), updated_at = now()
   where id = pg.id;

  if pl.tipo = 'plan' then
    update public.negocios
       set plan_id = pl.id,
           plan_vence_at = (case when plan_id = pl.id and plan_vence_at > now() then plan_vence_at else now() end)
                           + make_interval(days => pl.duracion_dias)
     where id = pg.negocio_id;
  elsif pl.tipo = 'extra' then
    update public.ofertas
       set destacada_hasta = (case when destacada_hasta > now() then destacada_hasta else now() end)
                             + make_interval(days => pl.duracion_dias)
     where id = pg.oferta_id and negocio_id = pg.negocio_id;
  end if;

  return true;
end;
$fn$;

revoke all on function public.aplicar_pago_aprobado(uuid, text, text) from public, anon, authenticated;
grant execute on function public.aplicar_pago_aprobado(uuid, text, text) to service_role;
