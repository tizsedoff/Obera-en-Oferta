# Cobro a negocios (Mercado Pago)

Los negocios pagan por **planes** (más ofertas activas) y por **destacar una oferta**. Todo se configura en la tabla `public.planes`.

## Variables de entorno (Vercel → Preview, rama `staging`)
| Variable | Para qué |
|---|---|
| `MP_ACCESS_TOKEN` | Credencial de Mercado Pago (de PRUEBA en staging). Sin esta variable los pagos quedan deshabilitados y el panel lo avisa. |
| `MP_WEBHOOK_SECRET` | Clave secreta del webhook (Mercado Pago → Tus integraciones → Webhooks). Recomendada. |
| `SITE_URL` | Solo producción: dominio público. En Preview se toma del deployment. |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | La agrega Vercel sola. Deja pasar los webhooks de Mercado Pago a los Preview protegidos. |

## Webhook
`POST /api/payments/webhook`. Cada pago crea su propia `notification_url`; además hay que activar la notificación de **Pagos** en el panel de la integración de Mercado Pago.
El endpoint nunca confía en el cuerpo del mensaje: consulta el pago a Mercado Pago y valida estado, referencia y monto.

## Cambiar precios o límites (sin tocar código)
```sql
update public.planes set precio_ars = 12900 where id = 'pro';
update public.planes set max_ofertas_activas = 3 where id = 'gratis';
```
Los precios que trae la migración son de ejemplo.

## Probar en staging
1. Cargar `MP_ACCESS_TOKEN` (credenciales de prueba) y redeployar `staging`.
2. Entrar con un usuario comercio → "Mi plan y pagos" → Contratar.
3. Pagar con un usuario/tarjeta de prueba de Mercado Pago.
4. Verificar en `public.pagos` que el estado pasa a `aprobado` y que `negocios.plan_id` / `plan_vence_at` cambian.

## Pendiente conocido
- Reembolsos: el pago se marca `reembolsado`, pero retirar el plan o el destacado es manual por ahora.
- Un segundo pago aprobado para el mismo pedido no se aplica dos veces; queda un aviso en los logs para reembolsarlo.
- Para producción hay que aplicar `docs/sql/2026-09-20-pagos-negocios.sql` en la base de producción antes de mergear a `main`.
