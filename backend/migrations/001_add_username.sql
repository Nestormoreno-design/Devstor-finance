-- 001_add_username.sql
-- Migración segura: agrega la columna `username` (identidad de login) a `users`
-- para su uso como login con usuario (el email queda como dato secundario).
-- PostgreSQL / Supabase. Idempotente (se puede ejecutar varias veces, no falla).
-- NO borra la tabla, NO borra usuarios, NO hace DROP de nada.

-- 1) Agregar la columna como nullable (aún no tiene datos)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username VARCHAR(80);

-- 2) Backfill: asignar un username válido a cada usuario existente,
--    derivado del local-part de su email, en minúsculas y deduplicado.
DO $$
DECLARE
  r          RECORD;
  base_name  TEXT;
  candidate  TEXT;
  try_num    INT;
BEGIN
  FOR r IN
    SELECT id, email
    FROM public.users
    WHERE username IS NULL OR username = ''
    ORDER BY created_at ASC, id ASC
  LOOP
    base_name := lower(split_part(coalesce(r.email, ''), '@', 1));
    base_name := regexp_replace(base_name, '[^a-zA-Z0-9_.-]', '_', 'g');
    base_name := left(btrim(base_name, '._-'), 80);
    IF base_name = '' THEN
      base_name := 'user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.users WHERE username = base_name) THEN
      UPDATE public.users SET username = base_name WHERE id = r.id;
    ELSE
      candidate := base_name;
      try_num := 2;
      WHILE EXISTS (SELECT 1 FROM public.users WHERE username = candidate) LOOP
        candidate := base_name || '_' || try_num;
        try_num := try_num + 1;
      END LOOP;
      UPDATE public.users SET username = candidate WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- 3) Red de seguridad: filas que siguieran sin username (p.ej. email NULL)
UPDATE public.users
SET username = 'user_' || replace(id::text, '-', '')
WHERE username IS NULL OR username = '';

-- 3b) Red de seguridad: elimina cualquier duplicado residual (insensible a mayúsculas)
DO $$
DECLARE
  r          RECORD;
  candidate  TEXT;
  try_num    INT;
BEGIN
  FOR r IN
    SELECT id, username
    FROM public.users u
    WHERE EXISTS (
      SELECT 1 FROM public.users o
      WHERE lower(o.username) = lower(u.username) AND o.id <> u.id
    )
    ORDER BY u.created_at ASC, u.id ASC
  LOOP
    candidate := lower(r.username);
    try_num := 2;
    WHILE EXISTS (
      SELECT 1 FROM public.users o
      WHERE lower(o.username) = lower(candidate) AND o.id <> r.id
    ) LOOP
      candidate := lower(r.username) || '_' || try_num;
      try_num := try_num + 1;
    END LOOP;
    UPDATE public.users SET username = candidate WHERE id = r.id;
  END LOOP;
END $$;

-- 4) Ya no hay NULL: aplicar NOT NULL
ALTER TABLE public.users ALTER COLUMN username SET NOT NULL;

-- 5) Índice único (equivale a unique + index del modelo User)
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON public.users (username);