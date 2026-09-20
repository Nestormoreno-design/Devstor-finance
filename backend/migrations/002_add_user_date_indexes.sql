-- 002_add_user_date_indexes.sql
-- Migración de RENDIMIENTO exclusivamente (no cambia datos ni esquema de datos).
-- Crea índices compuestos (user_id, date) sobre income y expenses para las
-- consultas agregadas más frecuentes del dashboard:
--   * SUM de ingresos/gastos del período (WHERE user_id = ? AND date BETWEEN ?)
--   * Gastos por categoría del período (WHERE user_id = ? AND date BETWEEN ?)
-- Idempotente: usa CREATE INDEX IF NOT EXISTS, se puede ejecutar varias veces.
-- NO borra tablas, NO borra datos, NO hace DROP.
-- PostgreSQL / Supabase.

CREATE INDEX IF NOT EXISTS ix_income_user_date
  ON public.income (user_id, date);

CREATE INDEX IF NOT EXISTS ix_expenses_user_date
  ON public.expenses (user_id, date);