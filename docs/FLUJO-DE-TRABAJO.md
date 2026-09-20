# Flujo de trabajo: producción y staging

| Rama | Entorno | Base de datos (Supabase) | Claves de pago |
|------|---------|--------------------------|----------------|
| `main` | Producción (web pública) | proyecto **GIANNIZI** | reales |
| `staging` y cualquier otra rama | Preview de Vercel (no es público) | proyecto **obera-en-oferta-staging** | de prueba |

Vercel decide qué variables usar según el entorno: las de *Production* solo se aplican a `main`;
las de *Preview* se aplican a todas las demás ramas. Por eso probar en `staging` nunca toca los datos reales.

## Desarrollar algo nuevo (ej. pagos)
1. `git checkout staging` y crear una rama: `git checkout -b feat/pagos`.
2. Hacer los cambios y subirlos; Vercel genera un preview con la base de staging.
3. Cuando funciona, PR hacia `staging`. Probar en la URL estable de staging.
4. Cuando staging está aprobado, PR de `staging` hacia `main` (se publica).

## Arreglo urgente en la web pública
1. Crear la rama desde `main`: `git checkout main && git checkout -b fix/lo-que-sea`.
2. PR hacia `main` y merge (sale a producción).
3. Traer el arreglo a staging para que no se desalineen: PR de `main` hacia `staging`.

## Cambios en la base de datos
Aplicarlos **primero en staging**, probar, y recién después repetirlos en producción.
Guardar el SQL en `supabase/migrations/` con fecha en el nombre para no perder el historial.

## Reglas
- No trabajar directamente sobre `main`.
- Las claves secretas (service key, token de Mercado Pago, etc.) solo en variables de entorno de Vercel, nunca en el código.
