-- Obera en Oferta: suscripciones (cobro recurrente) con prueba gratuita. TEMPORAL, SOLO PARA PRUEBAS EN STAGING.
-- Requiere docs/sql/2026-09-20-pagos-negocios.sql. Para producción NO hace falta aplicarlo (el código lo deja apagado).

-- Una prueba gratuita por negocio
alter table public.negocios add column if not exists trial_usado boolean not null default false;

create table if not exists public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  plan_id text not null references public.planes(id),
  monto_ars numeric(12,2) not null check (monto_ars > 0),
  con_trial boolean not null default false,
  trial_dias int,
  trial_aplicado boolean not null default false,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'autorizada', 'pausada', 'cancelada')),
  mp_preapproval_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists suscripciones_negocio_idx on public.suscripciones (negocio_id, created_at desc);
alter table public.suscripciones enable row level security;  -- sin políticas: solo el servidor (service key)

-- Suscripción autorizada en Mercado Pago: si tiene prueba gratuita, se da el plan por esos días (una sola vez por negocio)
create or replace function public.activar_suscripcion(p_susc_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  s public.suscripciones;
  ya_uso_trial boolean;
begin
  select * into s from public.suscripciones where id = p_susc_id for update;
  if not found then return false; end if;
  if s.estado = 'autorizada' and (s.trial_aplicado or not s.con_trial) then return false; end if;
  if s.estado = 'cancelada' then return false; end if;

  update public.suscripciones set estado = 'autorizada', updated_at = now() where id = s.id;

  if s.con_trial and not s.trial_aplicado then
    select trial_usado into ya_uso_trial from public.negocios where id = s.negocio_id for update;
    if not coalesce(ya_uso_trial, false) then
      update public.negocios
         set plan_id = s.plan_id,
             plan_vence_at = (case when plan_id = s.plan_id and plan_vence_at > now() then plan_vence_at else now() end)
                             + make_interval(days => s.trial_dias),
             trial_usado = true
       where id = s.negocio_id;
    end if;
    update public.suscripciones set trial_aplicado = true where id = s.id;
  end if;
  return true;
end;
$fn$;

-- Cobro recurrente aprobado: registra el pago (una sola vez por pago de MP) y extiende el plan
create or replace function public.aplicar_cobro_suscripcion(p_susc_id uuid, p_mp_payment_id text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  s public.suscripciones;
  pl public.planes;
  n int;
begin
  select * into s from public.suscripciones where id = p_susc_id for update;
  if not found then return false; end if;
  select * into pl from public.planes where id = s.plan_id;

  insert into public.pagos (negocio_id, owner_id, plan_id, monto_ars, estado, mp_payment_id, mp_status, aprobado_at)
  values (s.negocio_id, s.owner_id, s.plan_id, s.monto_ars, 'aprobado', p_mp_payment_id, 'approved', now())
  on conflict (mp_payment_id) do nothing;
  get diagnostics n = row_count;
  if n = 0 then return false; end if;

  update public.negocios
     set plan_id = s.plan_id,
         plan_vence_at = (case when plan_id = s.plan_id and plan_vence_at > now() then plan_vence_at else now() end)
                         + make_interval(days => pl.duracion_dias)
   where id = s.negocio_id;

  if s.estado <> 'autorizada' and s.estado <> 'cancelada' then
    update public.suscripciones set estado = 'autorizada', updated_at = now() where id = s.id;
  end if;
  return true;
end;
$fn$;

revoke all on function public.activar_suscripcion(uuid) from public, anon, authenticated;
revoke all on function public.aplicar_cobro_suscripcion(uuid, text) from public, anon, authenticated;
grant execute on function public.activar_suscripcion(uuid) to service_role;
grant execute on function public.aplicar_cobro_suscripcion(uuid, text) to service_role;
