# Devstor Finance

Aplicación de finanzas personales — bolsillos, ingresos, gastos, transferencias entre bolsillos y fondos especiales.

*A Devstor Project · Nestor Moreno*

## Estado actual — MVP completo

✅ Autenticación (registro, login con **usuario + contraseña**, JWT, rutas protegidas — el correo es dato secundario de la cuenta)
✅ Bolsillos (CRUD + saldo calculado, nunca almacenado; edición de nombre/tipo/descripción desde la UI)
✅ Eliminación segura de bolsillos con reglas financieras (ver abajo)
✅ Categorías (10 por defecto + personalizadas por usuario)
✅ Ingresos (con fecha retroactiva)
✅ Gastos (con fecha retroactiva, origen físico obligatorio + fondo opcional)
✅ Transferencias entre bolsillos (nunca cuentan como ingreso/gasto)
✅ Fondos especiales (sin duplicar dinero — ver detalle abajo)
✅ Historial unificado con filtros (tipo, bolsillo, categoría, fondo, búsqueda, rango de valor)
✅ Dashboard con gráficos (Recharts): dinero total, ingresos/gastos del periodo, balance, tasa de ahorro, gastos por categoría
✅ Responsive, mobile-first, con navegación inferior y FAB de captura rápida
✅ Modo oscuro con preferencia guardada
✅ PWA instalable (manifest + iconos + service worker)
✅ Onboarding de bolsillos iniciales

Todo el flujo financiero (ingreso → gasto → transferencia → gasto contra un fondo) fue
probado de extremo a extremo contra el backend real antes de entregarse, incluyendo el
caso crítico de que los fondos **no duplican dinero** en el patrimonio total.

Preparado pero no implementado en el MVP (arquitectura lista para extender):
presupuestos, metas de ahorro, notificaciones, reportes PDF/Excel, calendario financiero,
duplicar movimiento, edición de historial desde la UI (el backend ya soporta
editar/eliminar vía PUT/DELETE en cada endpoint; falta exponerlo en la interfaz).

## Arquitectura

```
devstor-finance/
├── backend/    FastAPI + SQLAlchemy + PostgreSQL (Supabase)
├── frontend/   React + Vite + Tailwind + Recharts + PWA
└── README.md
```

## Cómo se garantiza la corrección financiera

- **El saldo de un bolsillo nunca se guarda** — se calcula en cada consulta
  (`app/services/balance_service.py`) como: saldo inicial + ingresos − gastos
  − transferencias salientes + transferencias entrantes. Editar o eliminar un
  movimiento corrige el saldo automáticamente, sin pasos manuales. Cada bolsillo
  expone además `movement_count` (ingresos + gastos + transferencias en ambas
  direcciones), calculado siempre en el backend.
- **Una transferencia nunca es ingreso ni gasto** — vive en su propia tabla,
  así que las estadísticas de ingresos/gastos y el dashboard nunca la tocan.
- **Un fondo es una etiqueta de presupuesto, no una billetera nueva** — todo
  gasto tiene un `pocket_id` obligatorio (de dónde sale el dinero real) y un
  `fund_id` opcional (contra qué presupuesto se cuenta). El gasto reduce el
  bolsillo real Y el disponible del fondo, sin sumar dinero extra en ningún
  lado. El patrimonio total (`/pockets/total`) solo suma bolsillos, nunca fondos.
- Todos los montos usan `NUMERIC(14,2)` en PostgreSQL y `Decimal` en Python
  — nunca `float` — para evitar errores de precisión.

## Edición y eliminación de bolsillos

- Cada `PocketCard` tiene un menú `⋮` con **Editar** (endpoint `PUT /pockets/{id}`
  existente) y **Eliminar**. Editar el nombre/tipo/descripción **no** modifica
  movimientos ni saldo; el saldo se sigue calculando con la lógica financiera.
- El backend **siempre** valida la eliminación (no solo el frontend):
  - **Regla A — con dinero:** si el saldo calculado es mayor que 0, se rechaza
    con `409` y el mensaje indica que primero hay que retirar o transferir el
    dinero a otro bolsillo. El frontend muestra un modal informativo.
  - **Regla B — sin dinero pero con historial:** permite eliminarlo, previa
    confirmación que informa cuántos movimientos se borrarán y que el historial
    se pierde para siempre.
  - **Regla C — vacío y sin historial:** confirmación simple.
- La eliminación es **transaccional**: se borran los ingresos, gastos
  (y sus `fund_transactions` asociados, restaurando el disponible del fondo) y
  transferencias del bolsillo (como origen **y** destino) y luego el propio
  bolsillo. O se elimina todo, o no se elimina nada.

> ⚠️ **Advertencia de pérdida de historial:** si un bolsillo transfirió o recibió
> dinero de otros bolsillos, borrar su historial elimina también esas
> transferencias. La consecuencia es que el saldo calculado del bolsillo
> contraparte se ajusta en consecuencia (el crédito asociado desaparece).
> El patrimonio total y los saldos restantes siempre se recalculan de forma
> dinámica y sin registros huérfanos, pero **se pierde ese historial para
> siempre**. Por eso la confirmación (Regla B) lo advierte explícitamente.

## Backend — instalación local

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Completa DATABASE_URL (de Supabase) y JWT_SECRET (openssl rand -hex 32)

python -m app.database.create_tables   # crea las tablas en Postgres
python -m app.database.seed            # crea las categorías por defecto
# SOLO si ya tenías una base de datos con usuarios previos sin username:
#   Opción A (recomendada, Supabase): ejecuta el script SQL
#     backend/migrations/001_add_username.sql en el SQL Editor de Supabase.
#   Opción B: python -m app.database.migrate_add_username
# Índices de rendimiento del dashboard (opcional pero recomendado):
#   backend/migrations/002_add_user_date_indexes.sql en el SQL Editor de Supabase
#   (o: python -m app.database.migrate_user_date_indexes)
# Tabla de recuperación de contraseña:
#   backend/migrations/003_add_password_reset_tokens.sql en el SQL Editor de Supabase
#   (o: python -m app.database.create_tables — create_all crea solo lo que falta)
uvicorn app.main:app --reload          # http://localhost:8000
```

Documentación interactiva de la API: `http://localhost:8000/docs`

## Frontend — instalación local

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:8000
npm run dev              # http://localhost:5173
```

## Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **Project Settings → Database → Connection string** y copia la URI (modo *Session pooler* o *Direct connection*).
3. Pégala en `backend/.env` como `DATABASE_URL`.
4. Corre `python -m app.database.create_tables` y luego `python -m app.database.seed`.
5. Si la base **ya tenía usuarios** creados antes de este cambio, la tabla `users`
   no tiene la columna `username` y el registro/login fallan con
   `column users.username does not exist`. Aplica la migración **una sola vez**:
   abre el **SQL Editor** de Supabase (**Tabla de edición → New query**,
   o `supabase/dashboard → SQL`), pega el contenido de
   `backend/migrations/001_add_username.sql` y ejecútalo. Es idempotente y
   **no borra tabla, usuarios ni datos**: agrega la columna, asigna usernames
   derivados del correo a los usuarios existentes (deduplicados) y la deja
   `UNIQUE NOT NULL` con índice. También existe el equivalente en Python:
   `python -m app.database.migrate_add_username` (mismo resultado, para
   PostgreSQL o SQLite de desarrollo).

> **Rendimiento (opcional, recomendado en Supabase):** las consultas agregadas
> del dashboard filtran por `user_id` + rango de fechas. Para indexarlas
> correctamente ejecuta `backend/migrations/002_add_user_date_indexes.sql`
> en el SQL Editor de Supabase (idempotente: `CREATE INDEX IF NOT EXISTS`,
> no toca datos), o bien `python -m app.database.migrate_user_date_indexes`.

> **Recuperación de contraseña:** el flujo usa tokens de un solo uso que se
> guardan hasheados (`sha256`) en la tabla `password_reset_tokens`. Sin SMTP
> configurado el enlace se escribe en el log del backend (modo desarrollo).
> Para enviar correos de verdad define en `.env`: `FRONTEND_URL` (base del
> frontend donde se arma `/reset-password?token=...`) y las variables
> `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`,
> `EMAIL_USE_TLS` (ver `backend/.env.example`). La respuesta del endpoint es
> siempre la misma, exista o no la cuenta (anti-enumeración).

## Build y deploy

**Frontend → Vercel**
```bash
cd frontend
npm run build     # genera dist/
```
Configura la variable de entorno `VITE_API_URL` en Vercel apuntando al backend desplegado.

**Backend → Render / Railway**
- Comando de inicio: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Variables de entorno: `DATABASE_URL`, `JWT_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `CORS_ORIGINS` (incluye la URL de Vercel).
- Después del primer deploy, corre una vez `python -m app.database.create_tables && python -m app.database.seed` (por ejemplo desde una shell del servicio o un job one-off).

**Base de datos → Supabase** (ya configurada en el paso anterior).

## Variables de entorno

| Variable | Dónde | Descripción |
|---|---|---|
| `DATABASE_URL` | backend | Cadena de conexión a PostgreSQL/Supabase |
| `JWT_SECRET` | backend | Secreto para firmar tokens JWT (nunca lo subas a git) |
| `JWT_ALGORITHM` | backend | `HS256` por defecto |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | backend | Duración de la sesión |
| `CORS_ORIGINS` | backend | Dominios del frontend permitidos, separados por coma |
| `VITE_API_URL` | frontend | URL base del backend |

## Estructura de carpetas

```
backend/app/
├── main.py           # registro de routers y CORS
├── core/              # config, seguridad (JWT/bcrypt), dependencias de auth
├── database/          # sesión, base declarativa, create_tables, seed,
│                       # y migrate_add_username / migrate_user_date_indexes /
│                       # migrate_password_reset_tokens
├── migrations/         # 001_add_username, 002_add_user_date_indexes y
│                       # 003_add_password_reset_tokens — idempotentes, SQL para Supabase
├── models/            # SQLAlchemy: User, Pocket, Category, Income, Expense,
│                       # Transfer, Fund, FundTransaction
├── schemas/            # Pydantic (request/response)
├── routers/            # endpoints REST, uno por módulo
└── services/            # lógica de negocio — balance_service y fund_service
                          # son los ÚNICOS lugares donde se calculan saldos/disponibles

frontend/src/
├── pages/               # Dashboard, Pockets, Funds, History, More, Onboarding, Login, Register
├── components/          # PocketCard, FundCard, MovementRow, FabMenu, modales de captura rápida
├── layouts/              # AuthLayout, AppLayout (bottom nav + FAB)
├── context/              # AuthContext, ThemeContext
└── services/             # un archivo por recurso de la API (axios)
```

## Notas técnicas

- `passlib` requiere `bcrypt==4.0.1` explícitamente (versiones más nuevas de
  `bcrypt` rompen el hashing) — ya está fijado en `requirements.txt`.
- Los campos con el mismo nombre que su tipo (`date: date`, `time: time`)
  rompen la resolución de tipos de Pydantic v2 al arrancar la app. Por eso
  los schemas importan `date as date_type` / `time as time_type`.
- SQLite (usado en desarrollo/pruebas rápidas) no aplica llaves foráneas por
  defecto; `database/session.py` las activa explícitamente con
  `PRAGMA foreign_keys=ON` para que el comportamiento sea igual que en
  PostgreSQL en producción.
