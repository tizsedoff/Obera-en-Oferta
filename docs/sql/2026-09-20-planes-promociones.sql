-- Obera en Oferta: planes Emprendedor / Negocio / Comercio / Personalizado, promociones y cobro mensual.
-- Se aplica DESPUÉS de 2026-09-20-pagos-negocios.sql y 2026-09-20-suscripciones-prueba.sql.
-- Los precios son de EJEMPLO: se editan desde el panel de admin (pestaña "Planes y promos").

-- 0) Quién es admin del panel (superadmin o admin de public.admins)
create or replace function public.is_panel_admin()
returns boolean language sql stable security definer set search_path to 'public'
as $fn$
  select exists (select 1 from public.admins where id = auth.uid() and role in ('superadmin', 'admin'));
$fn$;

-- 1) Planes: más datos para mostrarlos y planes exclusivos de un negocio (los "personalizados")
alter table public.planes drop constraint if exists planes_tipo_check;
alter table public.planes add constraint planes_tipo_check check (tipo in ('plan', 'extra', 'personalizado'));
alter table public.planes
  add column if not exists emoji text,
  add column if not exists caracteristicas jsonb not null default '[]'::jsonb,
  add column if not exists recomendado boolean not null default false,
  add column if not exists negocio_id uuid references public.negocios(id) on delete cascade;

insert into public.planes (id, tipo, nombre, descripcion, precio_ars, duracion_dias, max_ofertas_activas, orden, emoji, caracteristicas, recomendado) values
  ('emprendedor', 'plan', 'Emprendedor', 'Para empezar a publicar tus ofertas', 5900, 30, 5, 2, '🟢',
    '["Hasta 5 ofertas activas", "Perfil del negocio", "WhatsApp"]'::jsonb, false),
  ('negocio', 'plan', 'Negocio', 'Más ofertas y más visibilidad', 9900, 30, 15, 3, '🔵',
    '["Hasta 15 ofertas activas", "Más visibilidad", "Destacados incluidos"]'::jsonb, true),
  ('comercio', 'plan', 'Comercio', 'Para negocios con mucho movimiento', 16900, 30, 30, 4, '🟣',
    '["Hasta 30 ofertas activas", "Más exposición", "Estadísticas"]'::jsonb, false),
  ('personalizado', 'personalizado', 'Personalizado', 'Elegí cuántas ofertas necesitás y armamos tu plan.', 0, null, null, 5, '⚙️',
    '[]'::jsonb, false)
on conflict (id) do nothing;

-- El plan "pro" de las pruebas pasa a llamarse "negocio" (mismas 15 ofertas)
update public.negocios set plan_id = 'negocio' where plan_id = 'pro';
update public.pagos set plan_id = 'negocio' where plan_id = 'pro';
update public.suscripciones set plan_id = 'negocio' where plan_id = 'pro';
delete from public.planes where id = 'pro';

update public.planes set emoji = '🆓', orden = 1, descripcion = 'Plan gratuito' where id = 'gratis';
update public.planes set emoji = '⭐' where tipo = 'extra' and emoji is null;

-- Los planes exclusivos de un negocio no se listan públicamente; el admin ve y edita todo
drop policy if exists "planes_select_activos" on public.planes;
create policy "planes_select_publicos" on public.planes for select to anon, authenticated using (activo and negocio_id is null);
create policy "planes_admin_all" on public.planes for all to authenticated using (public.is_panel_admin()) with check (public.is_panel_admin());

-- 2) Promociones (ej. Lanzamiento: 30% OFF durante 3 meses)
create table if not exists public.promociones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  descuento_pct numeric(5,2) not null check (descuento_pct > 0 and descuento_pct <= 100),
  meses int not null check (meses >= 1),
  aplica_a text[],                 -- ids de planes; NULL = todos los planes pagos
  activo boolean not null default true,
  inicio_at timestamptz,           -- ventana para ADHERIRSE a la promo (NULL = sin límite)
  fin_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.promociones enable row level security;
create policy "promociones_admin_all" on public.promociones for all to authenticated using (public.is_panel_admin()) with check (public.is_panel_admin());

-- Cuántos cobros con descuento ya usó cada negocio en cada promo
create table if not exists public.promo_usos (
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  promo_id uuid not null references public.promociones(id) on delete cascade,
  usos int not null default 0,
  primary key (negocio_id, promo_id)
);
alter table public.promo_usos enable row level security;  -- solo el servidor

insert into public.promociones (nombre, descripcion, descuento_pct, meses)
select 'Lanzamiento', '30% OFF durante 3 meses', 30, 3
where not exists (select 1 from public.promociones where nombre = 'Lanzamiento');

-- 3) Guardar el precio de lista y el descuento en cada pago y suscripción
alter table public.pagos
  add column if not exists monto_lista_ars numeric(12,2),
  add column if not exists descuento_pct numeric(5,2) not null default 0,
  add column if not exists promo_id uuid references public.promociones(id) on delete set null;

alter table public.suscripciones
  add column if not exists monto_lista_ars numeric(12,2),
  add column if not exists descuento_pct numeric(5,2) not null default 0,
  add column if not exists promo_id uuid references public.promociones(id) on delete set null,
  add column if not exists promo_ciclos_restantes int not null default 0,
  add column if not exists ciclos_cobrados int not null default 0;

-- 4) Solicitudes de plan personalizado
create table if not exists public.solicitudes_plan (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  cantidad_ofertas int not null check (cantidad_ofertas > 0 and cantidad_ofertas <= 10000),
  mensaje text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'atendida', 'descartada')),
  created_at timestamptz not null default now()
);
alter table public.solicitudes_plan enable row level security;
create policy "solicitudes_insert_propias" on public.solicitudes_plan for insert to authenticated
  with check (owner_id = (select auth.uid()) and exists (select 1 from public.negocios n where n.id = negocio_id and n.owner_id = (select auth.uid())));
create policy "solicitudes_select_propias" on public.solicitudes_plan for select to authenticated using (owner_id = (select auth.uid()));
create policy "solicitudes_admin_all" on public.solicitudes_plan for all to authenticated using (public.is_panel_admin()) with check (public.is_panel_admin());

-- 5) Precio que le corresponde a un negocio por un plan (aplica la mejor promo vigente)
create or replace function public.calcular_precio(p_negocio uuid, p_plan text)
returns table (o_monto numeric, o_lista numeric, o_pct numeric, o_promo_id uuid, o_promo_nombre text, o_promo_meses int, o_promo_restantes int)
language plpgsql stable security definer set search_path to 'public'
as $fn$
declare
  pl public.planes;
  pr public.promociones;
  u int;
begin
  select * into pl from public.planes where id = p_plan;
  if not found then return; end if;

  o_lista := pl.precio_ars; o_monto := pl.precio_ars; o_pct := 0;
  o_promo_id := null; o_promo_nombre := null; o_promo_meses := null; o_promo_restantes := null;

  if pl.tipo = 'plan' and pl.precio_ars > 0 then
    select p.* into pr
      from public.promociones p
      left join public.promo_usos pu on pu.negocio_id = p_negocio and pu.promo_id = p.id
     where p.activo
       and (p.aplica_a is null or pl.id = any (p.aplica_a))
       and coalesce(pu.usos, 0) < p.meses
       and (coalesce(pu.usos, 0) > 0
            or ((p.inicio_at is null or p.inicio_at <= now()) and (p.fin_at is null or p.fin_at > now())))
     order by p.descuento_pct desc
     limit 1;
    if found then
      select usos into u from public.promo_usos where negocio_id = p_negocio and promo_usos.promo_id = pr.id;
      o_pct := pr.descuento_pct;
      o_monto := round(pl.precio_ars * (1 - pr.descuento_pct / 100));
      o_promo_id := pr.id; o_promo_nombre := pr.nombre; o_promo_meses := pr.meses;
      o_promo_restantes := pr.meses - coalesce(u, 0);
    end if;
  end if;
  return next;
end;
$fn$;

create or replace function public.precios_negocio(p_negocio uuid)
returns table (plan_id text, monto numeric, lista numeric, pct numeric, promo_id uuid, promo_nombre text, promo_meses int, promo_restantes int)
language sql stable security definer set search_path to 'public'
as $fn$
  select pl.id, c.o_monto, c.o_lista, c.o_pct, c.o_promo_id, c.o_promo_nombre, c.o_promo_meses, c.o_promo_restantes
    from public.planes pl
    cross join lateral public.calcular_precio(p_negocio, pl.id) c
   where pl.activo and (pl.negocio_id is null or pl.negocio_id = p_negocio);
$fn$;

-- 6) Pago único aprobado: además de dar el plan, consume un uso de la promo
create or replace function public.aplicar_pago_aprobado(p_pago_id uuid, p_mp_payment_id text, p_mp_status text)
returns boolean
language plpgsql security definer set search_path to 'public'
as $fn$
declare
  pg public.pagos;
  pl public.planes;
begin
  select * into pg from public.pagos where id = p_pago_id for update;
  if not found or pg.estado = 'aprobado' then return false; end if;
  select * into pl from public.planes where id = pg.plan_id;

  update public.pagos
     set estado = 'aprobado', mp_payment_id = p_mp_payment_id, mp_status = p_mp_status, aprobado_at = now(), updated_at = now()
   where id = pg.id;

  if pl.tipo = 'plan' then
    update public.negocios
       set plan_id = pl.id,
           plan_vence_at = (case when plan_id = pl.id and plan_vence_at > now() then plan_vence_at else now() end)
                           + make_interval(days => pl.duracion_dias)
     where id = pg.negocio_id;
    if pg.promo_id is not null then
      insert into public.promo_usos (negocio_id, promo_id, usos) values (pg.negocio_id, pg.promo_id, 1)
      on conflict (negocio_id, promo_id) do update set usos = public.promo_usos.usos + 1;
    end if;
  elsif pl.tipo = 'extra' then
    update public.ofertas
       set destacada_hasta = (case when destacada_hasta > now() then destacada_hasta else now() end)
                             + make_interval(days => pl.duracion_dias)
     where id = pg.oferta_id and negocio_id = pg.negocio_id;
  end if;
  return true;
end;
$fn$;

-- 7) Cobro mensual de la suscripción: extiende UN MES, consume la promo y avisa si hay que subir el precio
drop function if exists public.aplicar_cobro_suscripcion(uuid, text);
create function public.aplicar_cobro_suscripcion(p_susc_id uuid, p_mp_payment_id text)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $fn$
declare
  s public.suscripciones;
  n int;
  restantes int;
  nuevo_monto numeric := null;
begin
  select * into s from public.suscripciones where id = p_susc_id for update;
  if not found then return jsonb_build_object('aplicado', false); end if;

  insert into public.pagos (negocio_id, owner_id, plan_id, monto_ars, monto_lista_ars, descuento_pct, promo_id, estado, mp_payment_id, mp_status, aprobado_at)
  values (s.negocio_id, s.owner_id, s.plan_id, s.monto_ars, coalesce(s.monto_lista_ars, s.monto_ars), s.descuento_pct, s.promo_id, 'aprobado', p_mp_payment_id, 'approved', now())
  on conflict (mp_payment_id) do nothing;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('aplicado', false); end if;

  update public.negocios
     set plan_id = s.plan_id,
         plan_vence_at = (case when plan_id = s.plan_id and plan_vence_at > now() then plan_vence_at else now() end) + interval '1 month'
   where id = s.negocio_id;

  update public.suscripciones set ciclos_cobrados = ciclos_cobrados + 1, updated_at = now() where id = s.id;

  if s.promo_id is not null and s.promo_ciclos_restantes > 0 then
    insert into public.promo_usos (negocio_id, promo_id, usos) values (s.negocio_id, s.promo_id, 1)
    on conflict (negocio_id, promo_id) do update set usos = public.promo_usos.usos + 1;

    restantes := s.promo_ciclos_restantes - 1;
    update public.suscripciones set promo_ciclos_restantes = restantes where id = s.id;
    if restantes = 0 and coalesce(s.monto_lista_ars, s.monto_ars) > s.monto_ars then
      nuevo_monto := s.monto_lista_ars;
      update public.suscripciones set monto_ars = s.monto_lista_ars, descuento_pct = 0 where id = s.id;
    end if;
  end if;

  if s.estado not in ('autorizada', 'cancelada') then
    update public.suscripciones set estado = 'autorizada', updated_at = now() where id = s.id;
  end if;
  return jsonb_build_object('aplicado', true, 'nuevo_monto', nuevo_monto);
end;
$fn$;

revoke all on function public.calcular_precio(uuid, text) from public, anon, authenticated;
revoke all on function public.precios_negocio(uuid) from public, anon, authenticated;
revoke all on function public.aplicar_cobro_suscripcion(uuid, text) from public, anon, authenticated;
revoke all on function public.aplicar_pago_aprobado(uuid, text, text) from public, anon, authenticated;
grant execute on function public.calcular_precio(uuid, text) to service_role;
grant execute on function public.precios_negocio(uuid) to service_role;
grant execute on function public.aplicar_cobro_suscripcion(uuid, text) to service_role;
grant execute on function public.aplicar_pago_aprobado(uuid, text, text) to service_role;

-- 8) Monto con descuento de cada suscripción: se conserva para aceptar el cobro aunque Mercado Pago tarde en subir el precio
alter table public.suscripciones add column if not exists monto_promo_ars numeric(12,2);

-- 9) Crear solicitudes de plan personalizado: "negocios" no tiene políticas, así que se verifica con una función segura
create or replace function public.es_dueno_de_negocio(p_negocio uuid)
returns boolean
language sql stable security definer set search_path to 'public'
as $fn$
  select exists (select 1 from public.negocios where id = p_negocio and owner_id = auth.uid());
$fn$;
revoke all on function public.es_dueno_de_negocio(uuid) from public, anon;
grant execute on function public.es_dueno_de_negocio(uuid) to authenticated;

drop policy if exists "solicitudes_insert_propias" on public.solicitudes_plan;
create policy "solicitudes_insert_propias" on public.solicitudes_plan for insert to authenticated
  with check (owner_id = (select auth.uid()) and public.es_dueno_de_negocio(negocio_id));
