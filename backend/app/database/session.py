from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# pool_pre_ping=False: cada `SELECT 1` de verificación costaba un round-trip
# (~170-290 ms) por request. Con el pooler de sesión de Supabase las conexiones
# se mantienen vivas; al desactivarlo no perdemos nada en este entorno y
# ahorramos un RTT por request.
# pool_size/max_overflow moderados y pool_recycle debajo del timeout de
# holgura del pooler para no dejar conexiones huérfanas ni disparar
# conexiones nuevas (~900 ms) en ráfagas.
_engine_kwargs = {}
if not settings.DATABASE_URL.startswith("sqlite"):
    _engine_kwargs["connect_args"] = {"connect_timeout": 10}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=False,
    pool_size=10,
    max_overflow=5,
    pool_recycle=1500,
    pool_timeout=30,
    **_engine_kwargs,
)

if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _enable_sqlite_fk(dbapi_connection, _):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency de FastAPI: una sesión por request, siempre cerrada al final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
