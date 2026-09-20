-- 004_add_lower_username_index.sql
-- Migración de RENDIMIENTO exclusivamente (no cambia datos ni esquema de datos).
-- Crea un índice funcional sobre lower(username) para acelerar la consulta
-- de login case-insensitive:
--   WHERE lower(username) = lower(?)
-- El índice B-tree normal (uq_users_username) NO se usa para lower().
-- Idempotente: usa CREATE INDEX IF NOT EXISTS, se puede ejecutar varias veces.
-- NO borra tablas, NO borra datos, NO hace DROP.
-- PostgreSQL / Supabase.

CREATE INDEX IF NOT EXISTS ix_users_lower_username
  ON public.users (lower(username));