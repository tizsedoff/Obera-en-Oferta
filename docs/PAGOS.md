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
update public.planes set precio_ars = 12900 where id = 'negocio';
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

---

## Suscripciones (TEMPORAL, solo pruebas)
Cobro automático cada `duracion_dias` del plan, con **15 días de prueba gratis** (una sola vez por negocio). Aplica a todos los planes de tipo `plan` con precio (hoy: Pro); los destacados siguen siendo pago único.

**Está apagada en producción.** Se activa sola fuera de producción (Preview/staging); en producción solo con `ENABLE_SUBSCRIPTIONS=true`.

| Variable | Para qué |
|---|---|
| `SUBSCRIPTION_TRIAL_DAYS` | Opcional. Días de prueba (15 por defecto). Poné `1` para probar el primer cobro rápido. |
| `ENABLE_SUBSCRIPTIONS` | Solo si algún día se quiere encender en producción. |

**Cómo funciona:** al suscribirse se crea la suscripción en Mercado Pago (`/preapproval`). Cuando queda *autorizada* el negocio recibe el plan por los días de prueba; cada cobro aprobado extiende el plan otros `duracion_dias`. Si se cancela o falla el cobro, el plan sigue hasta que venza lo ya otorgado. Cancelar se hace desde "Mi plan y pagos".

**Configuración necesaria en Mercado Pago (Webhooks de la integración):** además de *Pagos*, activar los eventos **Planes y suscripciones** y **Pagos recurrentes de suscripción**. La URL de notificación de las suscripciones es la del panel de la integración (no la de cada preferencia). En staging debe incluir el bypass de Vercel:
`https://<url-de-staging>/api/payments/webhook?x-vercel-protection-bypass=<secreto>`

**Probar:** con un usuario de prueba de Mercado Pago cuyo email coincida con el que se ingresa en "Email de tu cuenta de Mercado Pago". Verificar en `public.suscripciones` (`estado = autorizada`), en `negocios.plan_vence_at` y, al llegar el primer cobro, una fila nueva en `public.pagos`.

**Para sacarla:** borrar `api/payments/subscription.ts`, los bloques "suscripciones" de `status.ts` y `webhook.ts`, el bloque de suscripción de `PlanPanel.tsx` y el SQL `2026-09-20-suscripciones-prueba.sql`.

**A confirmar en la primera prueba:** que Mercado Pago acepte `free_trial` al crear la suscripción sin plan asociado (si lo rechaza, la app muestra un error y no crea nada).

---

## Modo demo (pagos simulados, sin Mercado Pago)
Para probar todo el flujo sin cuenta de Mercado Pago: en "Mi plan y pagos" aparecen botones **🧪 Demo** (pago único, destacar oferta, suscripción con prueba gratis y "Simular cobro del ciclo"). Aplican el plan o el destacado con las mismas funciones SQL que usa el webhook real, y dejan el registro en `pagos` con `mp_status = 'demo'` y `mp_payment_id = 'DEMO-…'`. No se cobra nada.

- **Nunca funciona en producción:** el servidor lo bloquea si `VERCEL_ENV = production`, sin variable que lo pueda forzar.
- Se apaga en staging con `PAYMENTS_DEMO=false`.
- Sin `MP_ACCESS_TOKEN` solo se ven los botones demo; con el token cargado se ven los reales y los demo juntos.
- "Simular cobro del ciclo" equivale al cobro que Mercado Pago haría cuando termina la prueba: suma otros `duracion_dias` al plan. Sirve para probar renovaciones sin esperar 15 días.
- Para dejar los datos de prueba limpios: `delete from public.pagos where mp_status = 'demo';` y, si hace falta, restablecer el negocio con `update public.negocios set plan_id='gratis', plan_vence_at=null, trial_usado=false where id='<id>';`.


---

## Planes, promociones y cobro mensual (todo editable desde el admin)

**Planes:** Emprendedor (5 ofertas), Negocio (15), Comercio (30) y la tarjeta Personalizado. Más "Gratis" (2 ofertas), que es el plan al que vuelve un negocio cuando vence el suyo. Precios, textos, características, emoji, orden, "Recomendado" y activo/inactivo se editan en el panel admin → **💳 Planes y promos**. Los precios de la migración son de EJEMPLO.

> Las características ("Destacados incluidos", "Estadísticas", etc.) hoy son **texto informativo**. Lo único que el sistema hace cumplir es la cantidad de ofertas activas.

**Personalizado:** el comercio indica cuántas ofertas necesita y se guarda una solicitud (`solicitudes_plan`). El admin la ve en la misma pestaña, crea un plan con "Exclusivo de un negocio" y el comercio lo ve como "A tu medida" en su panel, listo para contratar como cualquier otro.

**Promociones (`promociones`):** descuento % durante N meses, para todos los planes o solo algunos. La de **Lanzamiento** viene cargada (30% durante 3 meses).
- El precio con descuento lo calcula siempre el servidor (`calcular_precio`).
- Cada negocio usa la promo una sola vez: se cuentan sus cobros con descuento (`promo_usos`). Las fechas de la promo indican hasta cuándo se puede empezar a usar; quien ya la empezó la conserva hasta completar sus meses.
- Si hay varias vigentes, se aplica la de mayor descuento. Los destacados no llevan promo.

**Cobro todos los meses:**
- La suscripción de Mercado Pago cobra **cada mes** solo y cada cobro aprobado extiende el plan un mes. Cancelar corta los cobros y el plan sigue hasta que venza lo pagado.
- Con promo, la suscripción arranca con el precio con descuento; al completarse los meses de la promo el servidor sube el precio en Mercado Pago (`PUT /preapproval`) para el ciclo siguiente. Si Mercado Pago rechazara el aumento, queda registrado en los logs y se reintenta en el siguiente cobro.
- El pago único (sin suscripción) sigue existiendo: 1 mes por pago, sin renovación automática.
- **Hoy las suscripciones siguen siendo "modo prueba" (apagadas en producción).** Para cobrar todos los meses en producción hay que validarlas con Mercado Pago y activar `ENABLE_SUBSCRIPTIONS=true`.

**Pendiente conocido:** avisos de vencimiento próximo, qué hacer con las ofertas que sobran cuando un negocio baja de plan, y hacer cumplir las características (destacados incluidos, estadísticas).

---

## Plan personalizado con calculadora
En el panel del comercio, la tarjeta **Personalizado** tiene una calculadora: cantidad de ofertas × precio por oferta (hoy **$660**), con la promo aplicada. Entre el **mínimo** (31 por defecto) y el **máximo** (500) se contrata directo: pago único, suscripción o demo, igual que los demás planes. Al contratar, el servidor genera un plan a medida exclusivo de ese negocio (`custom_<negocio>_<cantidad>_<precio>`, con `automatico = true`) que guarda el precio y el límite de ofertas de ese momento; si después cambiás el precio por oferta, los planes ya contratados no se modifican.

Fuera de ese rango, o para pedidos especiales, el comercio usa **"Enviar consulta"** (queda en la pestaña Planes y promos, con aviso numérico en la pestaña) y, si cargás un número, **"Escribir por WhatsApp"** con el mensaje ya armado (negocio, cantidad y precio calculado).

Todo se edita en el admin → Planes y promos → tarjeta "Personalizado":
- **Precio por oferta** (en el campo "Precio"), **mínimo**, **máximo** y **WhatsApp de contacto** (con código de país, sin +; vacío = no se muestra el botón).
- Para que una promo aplique al personalizado, no marques planes (aplica a todos) o marcá "Personalizado".

Los planes personalizados contratados no aparecen en la lista de planes: se ven con "Ver N planes personalizados contratados".
