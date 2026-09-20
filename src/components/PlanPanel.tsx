import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Star, Loader2, RefreshCw, CheckCircle, AlertCircle, Clock, Check } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Offer } from '../types';

interface PromoInfo {
  nombre: string;
  meses: number;
  restantes: number;
}

interface Plan {
  id: string;
  tipo: 'plan' | 'extra' | 'personalizado';
  nombre: string;
  descripcion: string | null;
  precio_ars: number;
  precio_final?: number;
  descuento_pct?: number;
  promo?: PromoInfo | null;
  duracion_dias: number | null;
  max_ofertas_activas: number | null;
  emoji?: string | null;
  caracteristicas?: string[];
  recomendado?: boolean;
  negocio_id?: string | null;
}

interface Pago {
  id: string;
  plan_id: string;
  monto_ars: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado' | 'reembolsado';
  created_at: string;
  aprobado_at: string | null;
}

interface PlanStatus {
  negocio: { id: string; nombre: string } | null;
  plan?: { id: string; nombre: string; venceAt: string | null; maxOfertasActivas: number | null; ofertasActivas: number };
  planes: Plan[];
  pagos?: Pago[];
  pagosDisponibles: boolean;
  suscripcionesDisponibles?: boolean;
  demoDisponible?: boolean;
  suscripcion?: { id: string; planId: string; estado: 'pendiente' | 'autorizada' | 'pausada'; conTrial: boolean; trialDias: number | null } | null;
  trialDisponible?: boolean;
  trialDias?: number;
  solicitudPersonalizado?: { cantidadOfertas: number; creadaAt: string } | null;
}

const ESTADOS: Record<Pago['estado'], { texto: string; clase: string }> = {
  aprobado: { texto: 'Aprobado', clase: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  pendiente: { texto: 'Pendiente', clase: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  rechazado: { texto: 'Rechazado', clase: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' },
  cancelado: { texto: 'Cancelado', clase: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400' },
  reembolsado: { texto: 'Reembolsado', clase: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400' },
};

const formatoPesos = (n: number) => `$${Number(n).toLocaleString('es-AR')}`;
const formatoFecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

interface PlanPanelProps {
  myOffers: Offer[];
}

export default function PlanPanel({ myOffers }: PlanPanelProps) {
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [ofertaAdestacar, setOfertaAdestacar] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [cantidadCustom, setCantidadCustom] = useState('');
  const [mensajeCustom, setMensajeCustom] = useState('');
  const [enviandoCustom, setEnviandoCustom] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error' | 'info'; texto: string } | null>(null);

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token || null;

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Tu sesión expiró, volvé a iniciar sesión.');
      const res = await fetch('/api/payments/status', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error('Tu sesión se cerró (por ejemplo, al salir desde otra pestaña). Cerrá sesión y volvé a entrar.');
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar tu plan.');
      setStatus(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Mensaje al volver de Mercado Pago (?pago=ok|error|pendiente o ?suscripcion=ok)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const limpiar = () => {
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
    };
    const susc = params.get('suscripcion');
    if (susc) {
      setAviso({ tipo: 'info', texto: 'Volviste de Mercado Pago. Si la suscripción ya quedó autorizada, tu plan se activa en unos segundos; tocá "Actualizar" para verlo.' });
      params.delete('suscripcion');
      params.delete('preapproval_id');
      limpiar();
      return;
    }
    const pago = params.get('pago');
    if (!pago) return;
    if (pago === 'ok') setAviso({ tipo: 'ok', texto: '¡Pago recibido! Tu plan se activa en unos segundos; si no lo ves, tocá "Actualizar".' });
    else if (pago === 'pendiente') setAviso({ tipo: 'info', texto: 'Tu pago está pendiente de acreditación. Cuando se apruebe, se activa solo.' });
    else setAviso({ tipo: 'error', texto: 'El pago no se completó. Podés intentarlo de nuevo cuando quieras.' });
    params.delete('pago');
    limpiar();
  }, []);

  // Tras un pago demo se refrescan el plan y la lista de ofertas (destacadas)
  const refrescarTodo = async () => {
    await cargar();
    window.dispatchEvent(new CustomEvent('refresh-live-data'));
  };

  const pagar = async (plan: Plan, demo = false) => {
    setAviso(null);
    if (plan.tipo === 'extra' && !ofertaAdestacar) {
      setAviso({ tipo: 'error', texto: 'Elegí primero qué oferta querés destacar.' });
      return;
    }
    setPayingId(demo ? `demo:${plan.id}` : plan.id);
    try {
      const token = await getToken();
      if (!token) throw new Error('Tu sesión expiró, volvé a iniciar sesión.');
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: plan.id, ofertaId: plan.tipo === 'extra' ? ofertaAdestacar : undefined, demo: demo || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo iniciar el pago.');
      if (data.demo) {
        setAviso({ tipo: 'ok', texto: '🧪 Pago de prueba aprobado: ya quedó aplicado. Sin cobro real.' });
        setPayingId(null);
        await refrescarTodo();
        return;
      }
      if (!data.init_point) throw new Error('No se pudo iniciar el pago.');
      window.location.href = data.init_point;
    } catch (e: any) {
      setAviso({ tipo: 'error', texto: e.message });
      setPayingId(null);
    }
  };

  const suscribir = async (plan: Plan, demo = false) => {
    setAviso(null);
    setPayingId(demo ? `demo-sub:${plan.id}` : `sub:${plan.id}`);
    try {
      const token = await getToken();
      if (!token) throw new Error('Tu sesión expiró, volvé a iniciar sesión.');
      const res = await fetch('/api/payments/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: plan.id, payerEmail: payerEmail.trim() || undefined, demo: demo || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo crear la suscripción.');
      if (data.demo) {
        setAviso({
          tipo: 'ok',
          texto: data.conTrial
            ? `🧪 Suscripción de prueba activa con ${data.trialDias} días gratis. Sin cobro real.`
            : '🧪 Suscripción de prueba activa (primer cobro simulado). Sin cobro real.',
        });
        setPayingId(null);
        await refrescarTodo();
        return;
      }
      if (!data.init_point) throw new Error('No se pudo crear la suscripción.');
      window.location.href = data.init_point;
    } catch (e: any) {
      setAviso({ tipo: 'error', texto: e.message });
      setPayingId(null);
    }
  };

  const simularCobro = async () => {
    setAviso(null);
    setCancelando(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Tu sesión expiró, volvé a iniciar sesión.');
      const res = await fetch('/api/payments/subscription', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo simular el cobro.');
      setAviso({
        tipo: 'ok',
        texto: data.nuevoMonto
          ? `🧪 Cobro del mes simulado. Terminó la promoción: desde el próximo mes se cobra ${formatoPesos(data.nuevoMonto)}.`
          : '🧪 Cobro del mes simulado: el plan se extendió un mes. Sin cobro real.',
      });
      await refrescarTodo();
    } catch (e: any) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setCancelando(false);
    }
  };

  const cancelarSuscripcion = async () => {
    if (!window.confirm('¿Cancelar la suscripción? Tu plan sigue activo hasta que venza lo ya pagado.')) return;
    setAviso(null);
    setCancelando(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Tu sesión expiró, volvé a iniciar sesión.');
      const res = await fetch('/api/payments/subscription', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo cancelar la suscripción.');
      setAviso({ tipo: 'ok', texto: 'Suscripción cancelada. No se harán más cobros.' });
      await cargar();
    } catch (e: any) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setCancelando(false);
    }
  };

  const solicitarPersonalizado = async () => {
    setAviso(null);
    const cantidad = parseInt(cantidadCustom, 10);
    if (!status?.negocio || !Number.isFinite(cantidad) || cantidad < 1) {
      setAviso({ tipo: 'error', texto: 'Indicá cuántas ofertas necesitás (un número mayor a 0).' });
      return;
    }
    setEnviandoCustom(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error('Tu sesión expiró, volvé a iniciar sesión.');
      const { error: insertError } = await supabase.from('solicitudes_plan').insert({
        negocio_id: status.negocio.id,
        owner_id: userId,
        cantidad_ofertas: cantidad,
        mensaje: mensajeCustom.trim() || null,
      });
      if (insertError) throw new Error('No se pudo enviar la solicitud. Probá de nuevo.');
      setCantidadCustom('');
      setMensajeCustom('');
      setAviso({ tipo: 'ok', texto: '¡Solicitud enviada! Vamos a armar tu plan y te contactamos.' });
      await cargar();
    } catch (e: any) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setEnviandoCustom(false);
    }
  };

  const suscripcionActiva = status?.suscripcion || null;
  const planesPagos = (status?.planes || []).filter((p) => p.tipo === 'plan' && Number(p.precio_ars) > 0);
  const extras = (status?.planes || []).filter((p) => p.tipo === 'extra');
  const personalizado = (status?.planes || []).find((p) => p.tipo === 'personalizado');
  const puedePagar = !!status && (status.pagosDisponibles || status.demoDisponible);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-brand-orange dark:text-indigo-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-black text-base text-slate-900 dark:text-zinc-50">Mi plan y pagos</h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">Publicá más ofertas y destacá las que quieras vender primero.</p>
          </div>
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {aviso && (
        <div
          className={`p-3 rounded-2xl text-xs font-medium flex items-start gap-2 ${
            aviso.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
              : aviso.tipo === 'info'
              ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300'
          }`}
        >
          {aviso.tipo === 'ok' ? <CheckCircle className="w-4 h-4 shrink-0" /> : aviso.tipo === 'info' ? <Clock className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{aviso.texto}</span>
        </div>
      )}

      {loading && !status && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando tu plan...
        </div>
      )}

      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

      {status?.plan && (
        <div className="rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500">Plan actual</span>
            <p className="font-display font-black text-lg text-slate-900 dark:text-zinc-50">{status.plan.nombre}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500">Ofertas activas</span>
            <p className="font-bold text-sm text-slate-800 dark:text-zinc-200">
              {status.plan.ofertasActivas} / {status.plan.maxOfertasActivas ?? '∞'}
            </p>
          </div>
          {status.plan.venceAt && (
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500">
                {suscripcionActiva?.estado === 'autorizada' ? 'Próximo cobro / vence' : 'Vence'}
              </span>
              <p className="font-bold text-sm text-slate-800 dark:text-zinc-200">{formatoFecha(status.plan.venceAt)}</p>
            </div>
          )}
        </div>
      )}

      {status && !puedePagar && (
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Los pagos todavía no están habilitados en este entorno.</p>
      )}

      {status?.negocio && puedePagar && (
        <>
          {status.suscripcionesDisponibles && (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-slate-900 dark:bg-zinc-700 text-white px-2 py-0.5 rounded-full">🧪 Modo prueba</span>
                <h4 className="font-display font-black text-sm text-slate-900 dark:text-zinc-50">Cobro mensual automático</h4>
              </div>
              {suscripcionActiva ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-600 dark:text-zinc-300">
                    {suscripcionActiva.estado === 'pendiente' && 'Pendiente de autorización en Mercado Pago.'}
                    {suscripcionActiva.estado === 'autorizada' &&
                      `Activa${suscripcionActiva.conTrial ? ` · incluyó ${suscripcionActiva.trialDias} días de prueba gratis` : ''}. Se cobra cada mes automáticamente.`}
                    {suscripcionActiva.estado === 'pausada' && 'Pausada en Mercado Pago.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {status.demoDisponible && suscripcionActiva.estado === 'autorizada' && (
                      <button
                        onClick={simularCobro}
                        disabled={cancelando}
                        className="px-3 py-1.5 rounded-xl border border-dashed border-slate-400 dark:border-zinc-600 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-60 cursor-pointer"
                      >
                        🧪 Simular cobro del mes
                      </button>
                    )}
                    <button
                      onClick={cancelarSuscripcion}
                      disabled={cancelando}
                      className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-60 cursor-pointer"
                    >
                      {cancelando ? 'Procesando...' : 'Cancelar suscripción'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Suscribite a un plan y se cobra solo cada mes
                    {status.trialDisponible ? `, con ${status.trialDias} días de prueba gratis (una sola vez por negocio)` : ''}. Los destacados son pago único.
                  </p>
                  {status.pagosDisponibles && (
                    <input
                      type="email"
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      placeholder="Email de tu cuenta de Mercado Pago (opcional)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-100"
                    />
                  )}
                </>
              )}
            </div>
          )}

          {planesPagos.length > 0 && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {planesPagos.map((plan) => {
                const final = plan.precio_final ?? plan.precio_ars;
                const tieneDescuento = (plan.descuento_pct || 0) > 0 && final < plan.precio_ars;
                const esActual = status.plan?.id === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border p-4 flex flex-col gap-3 ${
                      plan.recomendado ? 'border-brand-orange dark:border-indigo-500 ring-1 ring-brand-orange/30 dark:ring-indigo-500/30' : 'border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display font-black text-sm text-slate-900 dark:text-zinc-50">
                        {plan.emoji || '📦'} Plan {plan.nombre}
                      </h4>
                      <div className="flex flex-col items-end gap-1">
                        {plan.negocio_id && <span className="text-[9px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">A tu medida</span>}
                        {plan.recomendado && <span className="text-[9px] font-extrabold uppercase bg-brand-orange dark:bg-indigo-600 text-white px-2 py-0.5 rounded-full">Recomendado</span>}
                        {esActual && <span className="text-[9px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">Tu plan</span>}
                      </div>
                    </div>

                    <div>
                      {tieneDescuento && <span className="text-xs text-slate-400 dark:text-zinc-500 line-through mr-2">{formatoPesos(plan.precio_ars)}</span>}
                      <span className="font-display font-black text-xl text-brand-orange dark:text-indigo-400">{formatoPesos(final)}</span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400"> / mes</span>
                      {tieneDescuento && plan.promo && (
                        <p className="mt-1 inline-block text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                          🔥 {plan.promo.nombre} — {plan.descuento_pct}% OFF
                          {plan.promo.restantes < plan.promo.meses ? ` · te quedan ${plan.promo.restantes} de ${plan.promo.meses} meses` : ` durante ${plan.promo.meses} meses`}
                        </p>
                      )}
                    </div>

                    {plan.descripcion && <p className="text-xs text-slate-500 dark:text-zinc-400">{plan.descripcion}</p>}
                    {(plan.caracteristicas || []).length > 0 && (
                      <ul className="space-y-1">
                        {(plan.caracteristicas || []).map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-zinc-300">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {c}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-auto flex flex-col gap-2">
                      {status.pagosDisponibles && (
                        <button
                          onClick={() => pagar(plan)}
                          disabled={payingId !== null}
                          className="px-4 py-2 rounded-xl bg-brand-orange dark:bg-indigo-600 text-white text-xs font-extrabold hover:opacity-90 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {payingId === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          {esActual ? 'Renovar 1 mes (pago único)' : 'Contratar 1 mes (pago único)'}
                        </button>
                      )}
                      {status.pagosDisponibles && status.suscripcionesDisponibles && !suscripcionActiva && (
                        <button
                          onClick={() => suscribir(plan)}
                          disabled={payingId !== null}
                          className="px-4 py-2 rounded-xl border-2 border-dashed border-brand-orange dark:border-indigo-500 text-brand-orange dark:text-indigo-400 text-xs font-extrabold hover:bg-indigo-50 dark:hover:bg-indigo-950/30 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {payingId === `sub:${plan.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          🧪 {status.trialDisponible ? `Suscribirme: ${status.trialDias} días gratis` : 'Suscribirme (cobro mensual)'}
                        </button>
                      )}
                      {status.demoDisponible && (
                        <button
                          onClick={() => pagar(plan, true)}
                          disabled={payingId !== null}
                          className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-zinc-700 text-white text-xs font-extrabold hover:opacity-90 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {payingId === `demo:${plan.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          🧪 Demo: simular pago de {formatoPesos(final)}
                        </button>
                      )}
                      {status.demoDisponible && status.suscripcionesDisponibles && !suscripcionActiva && (
                        <button
                          onClick={() => suscribir(plan, true)}
                          disabled={payingId !== null}
                          className="px-4 py-2 rounded-xl border-2 border-dashed border-slate-400 dark:border-zinc-600 text-slate-700 dark:text-zinc-300 text-xs font-extrabold hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {payingId === `demo-sub:${plan.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          🧪 Demo: suscripción {status.trialDisponible ? `con ${status.trialDias} días gratis` : 'sin prueba (ya usada)'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {personalizado && (
            <div className="rounded-2xl border border-dashed border-purple-300 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/10 p-4 space-y-3">
              <h4 className="font-display font-black text-sm text-slate-900 dark:text-zinc-50">
                {personalizado.emoji || '⚙️'} {personalizado.nombre}
              </h4>
              {personalizado.descripcion && <p className="text-xs text-slate-600 dark:text-zinc-300">{personalizado.descripcion}</p>}
              {(personalizado.caracteristicas || []).length > 0 && (
                <ul className="space-y-1">
                  {(personalizado.caracteristicas || []).map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {c}
                    </li>
                  ))}
                </ul>
              )}
              {status.solicitudPersonalizado ? (
                <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
                  ✅ Ya recibimos tu solicitud por {status.solicitudPersonalizado.cantidadOfertas} ofertas ({formatoFecha(status.solicitudPersonalizado.creadaAt)}). Te contactamos con tu plan.
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    min={1}
                    value={cantidadCustom}
                    onChange={(e) => setCantidadCustom(e.target.value)}
                    placeholder="¿Cuántas ofertas necesitás?"
                    className="sm:w-52 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-100"
                  />
                  <input
                    type="text"
                    value={mensajeCustom}
                    onChange={(e) => setMensajeCustom(e.target.value)}
                    placeholder="Contanos qué necesitás (opcional)"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-100"
                  />
                  <button
                    onClick={solicitarPersonalizado}
                    disabled={enviandoCustom}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {enviandoCustom ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Armar mi plan
                  </button>
                </div>
              )}
            </div>
          )}

          {extras.length > 0 && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h4 className="font-display font-black text-sm text-slate-900 dark:text-zinc-50">Destacar una oferta</h4>
              </div>
              {myOffers.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-zinc-400">Publicá una oferta para poder destacarla.</p>
              ) : (
                <>
                  <select
                    value={ofertaAdestacar}
                    onChange={(e) => setOfertaAdestacar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-100"
                  >
                    <option value="">Elegí una oferta...</option>
                    {myOffers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title}
                        {o.isFeatured ? ' (ya destacada)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {status.pagosDisponibles &&
                      extras.map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => pagar(plan)}
                          disabled={payingId !== null}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold disabled:opacity-60 cursor-pointer flex items-center gap-2"
                        >
                          {payingId === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          {plan.duracion_dias} días · {formatoPesos(plan.precio_ars)}
                        </button>
                      ))}
                    {status.demoDisponible &&
                      extras.map((plan) => (
                        <button
                          key={`demo-${plan.id}`}
                          onClick={() => pagar(plan, true)}
                          disabled={payingId !== null}
                          className="px-3.5 py-2 rounded-xl border-2 border-dashed border-amber-500 text-amber-700 dark:text-amber-400 text-xs font-extrabold hover:bg-amber-100/60 dark:hover:bg-amber-950/30 disabled:opacity-60 cursor-pointer flex items-center gap-2"
                        >
                          {payingId === `demo:${plan.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          🧪 Demo · {plan.duracion_dias} días
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {status?.pagos && status.pagos.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500">Últimos pagos</h4>
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {status.pagos.map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-600 dark:text-zinc-300">
                  {formatoFecha(p.created_at)} · {status.planes.find((pl) => pl.id === p.plan_id)?.nombre || p.plan_id}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-zinc-100">{formatoPesos(p.monto_ars)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${ESTADOS[p.estado].clase}`}>{ESTADOS[p.estado].texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
