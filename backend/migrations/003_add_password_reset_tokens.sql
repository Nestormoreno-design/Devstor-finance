-- 003_add_password_reset_tokens.sql
-- Migración segura para la recuperación de contraseña: crea la tabla
-- `password_reset_tokens` (tokens de un solo uso con expiración).
-- Idempotente: CREATE TABLE IF NOT EXISTS — se puede ejecutar varias veces.
-- NO borra tablas, NO borra datos, NO hace DROP.
-- PostgreSQL / Supabase.
--
-- Alternativa equivalente: correr `python -m app.database.create_tables`
-- (create_all solo crea las tablas que faltan, es seguro).

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_password_reset_tokens_token_hash
    ON public.password_reset_tokens (token_hash);

CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_user_id
    ON public.password_reset_tokens (user_id);