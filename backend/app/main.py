import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.database.session import engine
from app.routers import auth, pockets, categories, income, expenses, transfers, funds, dashboard, history

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Calienta el pool de conexiones ANTES de aceptar tráfico. La primera
    # conexión real a Supabase (TCP + TLS + auth de Postgres) mide ~2.5s en
    # este proyecto; las siguientes bajan a ~300ms (confirmado con logs de
    # producción: 2558ms en el primer login vs 296ms en el segundo, mismo
    # proceso). Sin esto, ese costo lo paga el primer usuario que hace login
    # después de cada arranque/redeploy. Con esto, lo paga el arranque del
    # servidor, en paralelo mientras uvicorn todavía está iniciando.
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("DB warm-up ok: primera conexión establecida al arrancar.")
    except Exception:
        # No tumbamos el arranque del servidor si la BD no responde en este
        # instante: el primer request real simplemente pagará el costo de
        # conexión (como antes), en vez de bloquear el health check.
        logger.exception("DB warm-up falló; se reintentará en el primer request real.")
    yield


app = FastAPI(title="Devstor Finance API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(pockets.router)
app.include_router(categories.router)
app.include_router(income.router)
app.include_router(expenses.router)
app.include_router(transfers.router)
app.include_router(funds.router)
app.include_router(dashboard.router)
app.include_router(history.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "devstor-finance-api"}