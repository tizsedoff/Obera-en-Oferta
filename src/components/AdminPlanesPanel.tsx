import React, { useCallback, useEffect, useState } from 'react';
import { Save, Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Shop } from '../types';

// Pestaña "Planes y promos" del panel de administración.
// Lee y escribe directo en Supabase con la sesión del admin: las políticas RLS (is_panel_admin) son las que protegen los datos.

interface PlanRow {
  id: string;
  tipo: 'plan' | 'extra' | 'personalizado';
  nombre: string;
  descripcion: string | null;
  precio_ars: number;
  duracion_dias: number | null;
  max_ofertas_activas: number | null;
  activo: boolean;
  orden: number;
  emoji: string | null;
  caracteristicas: string[];
  recomendado: boolean;
  negocio_id: string | null;
  min_ofertas: number | null;
  contacto_whatsapp: string | null;
  automatico: boolean;
}

interface PromoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  descuento_pct: number;
  meses: number;
  aplica_a: string[] | null;
  activo: boolean;
  inicio_at: string | null;
  fin_at: string | null;
}

interface SolicitudRow {
  id: string;
  negocio_id: string;
  cantidad_ofertas: number;
  mensaje: string | null;
  estado: 'pendiente' | 'atendida' | 'descartada';
  created_at: string;
}

const inputCls =
  'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#2B0E67]/30';
const labelCls = 'block text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500 mb-1';
const cardCls = 'rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 space-y-3';

const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));
const slug = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const isoDate = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

function PlanEditor({ plan, shops, onSave, isNew }: { plan: PlanRow; shops: Shop[]; onSave: (p: PlanRow) => Promise<void>; isNew?: boolean }) {
  const [d, setD] = useState({
    ...plan,
    caracteristicasTxt: (plan.caracteristicas || []).join('\n'),
    precio: String(plan.precio_ars ?? 0),
    dias: plan.duracion_dias === null ? '' : String(plan.duracion_dias),
    max: plan.max_ofertas_activas === null ? '' : String(plan.max_ofertas_activas),
    ord: String(plan.orden ?? 0),
    min: plan.min_ofertas === null || plan.min_ofertas === undefined ? '' : String(plan.min_ofertas),
  });
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    setSaving(true);
    await onSave({
      id: isNew ? slug(d.id || d.nombre) : d.id,
      tipo: d.tipo,
      nombre: d.nombre.trim(),
      descripcion: d.descripcion?.trim() || null,
      precio_ars: Number(d.precio) || 0,
      duracion_dias: numOrNull(d.dias),
      max_ofertas_activas: numOrNull(d.max),
      activo: d.activo,
      orden: Number(d.ord) || 0,
      emoji: d.emoji?.trim() || null,
      caracteristicas: d.caracteristicasTxt.split('\n').map((l) => l.trim()).filter(Boolean),
      recomendado: d.recomendado,
      negocio_id: d.negocio_id || null,
      min_ofertas: numOrNull(d.min),
      contacto_whatsapp: d.contacto_whatsapp?.replace(/[^0-9]/g, '') || null,
      automatico: d.automatico || false,
    });
    setSaving(false);
  };

  return (
    <div className={cardCls}>
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-3 sm:col-span-1">
          <label className={labelCls}>Emoji</label>
          <input className={inputCls} value={d.emoji || ''} onChange={(e) => setD({ ...d, emoji: e.target.value })} />
        </div>
        <div className="col-span-9 sm:col-span-4">
          <label className={labelCls}>Nombre</label>
          <input className={inputCls} value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} />
        </div>
        <div className="col-span-6 sm:col-span-3">
          <label className={labelCls}>Tipo</label>
          {isNew ? (
            <select className={inputCls} value={d.tipo} onChange={(e) => setD({ ...d, tipo: e.target.value as PlanRow['tipo'] })}>
              <option value="plan">Plan (mensual)</option>
              <option value="extra">Extra (destacar oferta)</option>
              <option value="personalizado">Tarjeta "Personalizado"</option>
            </select>
          ) : (
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 py-2">
              {d.tipo} · <span className="font-mono text-[10px] text-slate-400">{d.id}</span>
            </p>
          )}
        </div>
        <div className="col-span-6 sm:col-span-2">
          <label className={labelCls}>{d.tipo === 'personalizado' ? 'Precio por oferta (ARS)' : 'Precio (ARS)'}</label>
          <input type="number" min={0} className={inputCls} value={d.precio} onChange={(e) => setD({ ...d, precio: e.target.value })} />
        </div>
        <div className="col-span-6 sm:col-span-1">
          <label className={labelCls}>Días</label>
          <input type="number" min={1} className={inputCls} value={d.dias} onChange={(e) => setD({ ...d, dias: e.target.value })} />
        </div>
        <div className="col-span-6 sm:col-span-1">
          <label className={labelCls}>{d.tipo === 'personalizado' ? 'Máx. ofertas' : 'Ofertas'}</label>
          <input type="number" min={0} className={inputCls} value={d.max} onChange={(e) => setD({ ...d, max: e.target.value })} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Descripción</label>
          <textarea rows={3} className={inputCls} value={d.descripcion || ''} onChange={(e) => setD({ ...d, descripcion: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Características (una por línea)</label>
          <textarea rows={3} className={inputCls} value={d.caracteristicasTxt} onChange={(e) => setD({ ...d, caracteristicasTxt: e.target.value })} />
        </div>
      </div>

      {d.tipo === 'personalizado' && (
        <div className="grid sm:grid-cols-3 gap-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/10 border border-purple-200 dark:border-purple-900/40 p-3">
          <div>
            <label className={labelCls}>Mínimo de ofertas (calculadora)</label>
            <input type="number" min={1} className={inputCls} value={d.min} onChange={(e) => setD({ ...d, min: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>WhatsApp de contacto (con código de país, ej: 5493755123456)</label>
            <input className={inputCls} value={d.contacto_whatsapp || ''} onChange={(e) => setD({ ...d, contacto_whatsapp: e.target.value })} placeholder="Vacío = no se muestra el botón de WhatsApp" />
          </div>
          <p className="sm:col-span-3 text-[11px] text-slate-600 dark:text-zinc-300">
            La calculadora del comercio multiplica la cantidad de ofertas por el precio por oferta. Entre el mínimo y el máximo pueden contratar directo; fuera de ese rango se les ofrece "Consultar".
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-24">
          <label className={labelCls}>Orden</label>
          <input type="number" className={inputCls} value={d.ord} onChange={(e) => setD({ ...d, ord: e.target.value })} />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className={labelCls}>Exclusivo de un negocio (plan a medida)</label>
          <select className={inputCls} value={d.negocio_id || ''} onChange={(e) => setD({ ...d, negocio_id: e.target.value || null })}>
            <option value="">Público (lo ven todos)</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer pb-2">
          <input type="checkbox" checked={d.recomendado} onChange={(e) => setD({ ...d, recomendado: e.target.checked })} /> Recomendado
        </label>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer pb-2">
          <input type="checkbox" checked={d.activo} onChange={(e) => setD({ ...d, activo: e.target.checked })} /> Activo
        </label>
        <button
          onClick={guardar}
          disabled={saving || !d.nombre.trim() || (isNew && !slug(d.id || d.nombre))}
          className="ml-auto px-4 py-2 rounded-xl bg-[#2B0E67] text-white text-xs font-extrabold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" /> {saving ? 'Guardando...' : isNew ? 'Crear plan' : 'Guardar'}
        </button>
      </div>
      {isNew && (
        <div>
          <label className={labelCls}>Identificador (se genera del nombre si lo dejás vacío)</label>
          <input className={inputCls} value={d.id} onChange={(e) => setD({ ...d, id: e.target.value })} placeholder="ej: mi_plan" />
        </div>
      )}
    </div>
  );
}

function PromoEditor({
  promo,
  planesPagos,
  onSave,
  onDelete,
  isNew,
}: {
  promo: PromoRow;
  planesPagos: PlanRow[];
  onSave: (p: PromoRow) => Promise<void>;
  onDelete?: () => Promise<void>;
  isNew?: boolean;
}) {
  const [d, setD] = useState({
    ...promo,
    pct: String(promo.descuento_pct),
    meses: String(promo.meses),
    inicio: isoDate(promo.inicio_at),
    fin: isoDate(promo.fin_at),
  });
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    const actual = d.aplica_a || [];
    const nuevo = actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id];
    setD({ ...d, aplica_a: nuevo.length ? nuevo : null });
  };

  const guardar = async () => {
    setSaving(true);
    await onSave({
      id: d.id,
      nombre: d.nombre.trim(),
      descripcion: d.descripcion?.trim() || null,
      descuento_pct: Number(d.pct) || 0,
      meses: Math.max(1, Math.round(Number(d.meses) || 1)),
      aplica_a: d.aplica_a && d.aplica_a.length ? d.aplica_a : null,
      activo: d.activo,
      inicio_at: d.inicio ? new Date(`${d.inicio}T00:00:00`).toISOString() : null,
      fin_at: d.fin ? new Date(`${d.fin}T23:59:59`).toISOString() : null,
    });
    setSaving(false);
  };

  return (
    <div className={cardCls}>
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-4">
          <label className={labelCls}>Nombre</label>
          <input className={inputCls} value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} placeholder="Lanzamiento" />
        </div>
        <div className="col-span-6 sm:col-span-2">
          <label className={labelCls}>% descuento</label>
          <input type="number" min={1} max={100} className={inputCls} value={d.pct} onChange={(e) => setD({ ...d, pct: e.target.value })} />
        </div>
        <div className="col-span-6 sm:col-span-2">
          <label className={labelCls}>Durante (meses)</label>
          <input type="number" min={1} className={inputCls} value={d.meses} onChange={(e) => setD({ ...d, meses: e.target.value })} />
        </div>
        <div className="col-span-6 sm:col-span-2">
          <label className={labelCls}>Se puede tomar desde</label>
          <input type="date" className={inputCls} value={d.inicio} onChange={(e) => setD({ ...d, inicio: e.target.value })} />
        </div>
        <div className="col-span-6 sm:col-span-2">
          <label className={labelCls}>Hasta</label>
          <input type="date" className={inputCls} value={d.fin} onChange={(e) => setD({ ...d, fin: e.target.value })} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Descripción</label>
        <input className={inputCls} value={d.descripcion || ''} onChange={(e) => setD({ ...d, descripcion: e.target.value })} placeholder="30% OFF durante 3 meses" />
      </div>
      <div>
        <label className={labelCls}>Aplica a (si no marcás ninguno, aplica a todos los planes)</label>
        <div className="flex flex-wrap gap-3">
          {planesPagos.map((p) => (
            <label key={p.id} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={(d.aplica_a || []).includes(p.id)} onChange={() => toggle(p.id)} /> {p.emoji} {p.nombre}
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={d.activo} onChange={(e) => setD({ ...d, activo: e.target.checked })} /> Activa
        </label>
        <div className="ml-auto flex gap-2">
          {!isNew && onDelete && (
            <button
              onClick={async () => {
                if (window.confirm(`¿Eliminar la promoción "${d.nombre}"? Los negocios que ya la usaron conservan sus pagos.`)) await onDelete();
              }}
              className="px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          )}
          <button
            onClick={guardar}
            disabled={saving || !d.nombre.trim() || !(Number(d.pct) > 0 && Number(d.pct) <= 100)}
            className="px-4 py-2 rounded-xl bg-[#2B0E67] text-white text-xs font-extrabold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" /> {saving ? 'Guardando...' : isNew ? 'Crear promoción' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPlanesPanel({ shops }: { shops: Shop[] }) {
  const [planes, setPlanes] = useState<PlanRow[]>([]);
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [creandoPlan, setCreandoPlan] = useState(false);
  const [creandoPromo, setCreandoPromo] = useState(false);
  const [verAutomaticos, setVerAutomaticos] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [p, pr, s] = await Promise.all([
      supabase.from('planes').select('*').order('orden', { ascending: true }),
      supabase.from('promociones').select('*').order('created_at', { ascending: true }),
      supabase.from('solicitudes_plan').select('*').order('created_at', { ascending: false }),
    ]);
    if (p.error || pr.error || s.error) {
      setMsg({ tipo: 'error', texto: 'No se pudieron leer los datos. ¿Tu cuenta es admin? (' + (p.error || pr.error || s.error)?.message + ')' });
    } else {
      setPlanes((p.data || []) as PlanRow[]);
      setPromos((pr.data || []) as PromoRow[]);
      setSolicitudes((s.data || []) as SolicitudRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardarPlan = async (p: PlanRow, isNew = false) => {
    setMsg(null);
    const { id, ...campos } = p;
    const res = isNew ? await supabase.from('planes').insert({ id, ...campos }) : await supabase.from('planes').update(campos).eq('id', id);
    if (res.error) setMsg({ tipo: 'error', texto: `No se pudo guardar el plan: ${res.error.message}` });
    else {
      setMsg({ tipo: 'ok', texto: `Plan "${p.nombre}" guardado.` });
      if (isNew) setCreandoPlan(false);
      await cargar();
    }
  };

  const guardarPromo = async (p: PromoRow, isNew = false) => {
    setMsg(null);
    const { id, ...campos } = p;
    const res = isNew ? await supabase.from('promociones').insert(campos) : await supabase.from('promociones').update(campos).eq('id', id);
    if (res.error) setMsg({ tipo: 'error', texto: `No se pudo guardar la promoción: ${res.error.message}` });
    else {
      setMsg({ tipo: 'ok', texto: `Promoción "${p.nombre}" guardada.` });
      if (isNew) setCreandoPromo(false);
      await cargar();
    }
  };

  const borrarPromo = async (id: string) => {
    const res = await supabase.from('promociones').delete().eq('id', id);
    if (res.error) setMsg({ tipo: 'error', texto: `No se pudo eliminar: ${res.error.message}` });
    else {
      setMsg({ tipo: 'ok', texto: 'Promoción eliminada.' });
      await cargar();
    }
  };

  const cambiarEstadoSolicitud = async (id: string, estado: SolicitudRow['estado']) => {
    const res = await supabase.from('solicitudes_plan').update({ estado }).eq('id', id);
    if (res.error) setMsg({ tipo: 'error', texto: `No se pudo actualizar: ${res.error.message}` });
    else await cargar();
  };

  const planNuevo: PlanRow = {
    id: '', tipo: 'plan', nombre: '', descripcion: '', precio_ars: 0, duracion_dias: 30, max_ofertas_activas: 10,
    activo: true, orden: planes.length + 1, emoji: '🟠', caracteristicas: [], recomendado: false, negocio_id: null,
    min_ofertas: null, contacto_whatsapp: null, automatico: false,
  };
  const promoNueva: PromoRow = { id: '', nombre: '', descripcion: '', descuento_pct: 20, meses: 3, aplica_a: null, activo: true, inicio_at: null, fin_at: null };
  const planesPagos = planes.filter((p) => (p.tipo === 'plan' || p.tipo === 'personalizado') && p.precio_ars > 0 && !p.automatico);
  const automaticos = planes.filter((p) => p.automatico);
  const nombreNegocio = (id: string) => shops.find((s) => s.id === id)?.name || id.slice(0, 8);
  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente').length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-black text-lg text-slate-900 dark:text-zinc-50">Planes y promociones</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Todo lo que ven los comercios en "Mi plan y pagos". Los cambios se ven al instante.</p>
        </div>
        <button onClick={cargar} className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Recargar
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${msg.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300'}`}>
          {msg.tipo === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {msg.texto}
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-display font-black text-sm text-slate-900 dark:text-zinc-50">Planes</h4>
          <button onClick={() => setCreandoPlan(!creandoPlan)} className="px-3 py-1.5 rounded-xl bg-[#2B0E67] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /> Nuevo plan
          </button>
        </div>
        {creandoPlan && <PlanEditor plan={planNuevo} shops={shops} isNew onSave={(p) => guardarPlan(p, true)} />}
        {planes.filter((p) => !p.automatico).map((p) => (
          <React.Fragment key={`${p.id}-${JSON.stringify(p)}`}>
            <PlanEditor plan={p} shops={shops} onSave={(x) => guardarPlan(x)} />
          </React.Fragment>
        ))}
        {automaticos.length > 0 && (
          <div className="space-y-2">
            <button onClick={() => setVerAutomaticos(!verAutomaticos)} className="text-xs font-bold text-slate-600 dark:text-zinc-300 underline cursor-pointer">
              {verAutomaticos ? 'Ocultar' : 'Ver'} {automaticos.length} planes personalizados contratados (generados por el sistema)
            </button>
            {verAutomaticos && (
              <div className="space-y-1">
                {automaticos.map((p) => (
                  <p key={p.id} className="text-xs text-slate-600 dark:text-zinc-300">
                    {p.nombre} · {nombreNegocio(p.negocio_id || '')} · ${Number(p.precio_ars).toLocaleString('es-AR')}/mes · {p.max_ofertas_activas} ofertas
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
          Los planes no se borran para no perder el historial de pagos: desactivalos con "Activo". Un plan "Exclusivo" solo lo ve y lo puede contratar ese negocio (así se arma un plan personalizado).
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-display font-black text-sm text-slate-900 dark:text-zinc-50">Promociones</h4>
          <button onClick={() => setCreandoPromo(!creandoPromo)} className="px-3 py-1.5 rounded-xl bg-[#2B0E67] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /> Nueva promoción
          </button>
        </div>
        {creandoPromo && <PromoEditor promo={promoNueva} planesPagos={planesPagos} isNew onSave={(p) => guardarPromo(p, true)} />}
        {promos.map((p) => (
          <React.Fragment key={`${p.id}-${JSON.stringify(p)}`}>
            <PromoEditor promo={p} planesPagos={planesPagos} onSave={(x) => guardarPromo(x)} onDelete={() => borrarPromo(p.id)} />
          </React.Fragment>
        ))}
        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
          El descuento se aplica al pagar (los primeros N meses de cada negocio). Si una promoción tiene fechas, esas fechas indican hasta cuándo se puede empezar a usar; quien ya la empezó la conserva hasta completar sus meses. Si hay varias vigentes, se aplica la de mayor descuento.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="font-display font-black text-sm text-slate-900 dark:text-zinc-50">
          Solicitudes de plan personalizado {pendientes > 0 && <span className="ml-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold">{pendientes} pendientes</span>}
        </h4>
        {solicitudes.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-zinc-400">Todavía no hay solicitudes.</p>
        ) : (
          <div className="space-y-2">
            {solicitudes.map((s) => (
              <div key={s.id} className={`${cardCls} flex flex-wrap items-center justify-between gap-3`}>
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-zinc-50">
                    {nombreNegocio(s.negocio_id)} · {s.cantidad_ofertas} ofertas
                  </p>
                  <p className="text-slate-500 dark:text-zinc-400">
                    {new Date(s.created_at).toLocaleDateString('es-AR')}
                    {s.mensaje ? ` · "${s.mensaje}"` : ''}
                  </p>
                </div>
                <select className={`${inputCls} !w-auto`} value={s.estado} onChange={(e) => cambiarEstadoSolicitud(s.id, e.target.value as SolicitudRow['estado'])}>
                  <option value="pendiente">Pendiente</option>
                  <option value="atendida">Atendida</option>
                  <option value="descartada">Descartada</option>
                </select>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
          Para atender una solicitud: creá un plan con la cantidad de ofertas y el precio acordados, elegí el negocio en "Exclusivo" y marcá la solicitud como atendida. El comercio lo va a ver en su panel.
        </p>
      </section>
    </div>
  );
}
