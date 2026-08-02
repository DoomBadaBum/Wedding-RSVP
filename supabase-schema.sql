-- =============================================================================
-- Malaysian Wedding RSVP — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- RSVP table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rsvp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  pax INTEGER NOT NULL DEFAULT 1,
  attendance_status VARCHAR(20) NOT NULL DEFAULT 'hadir',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rsvp_name_length CHECK (char_length(trim(name)) >= 2),
  CONSTRAINT rsvp_pax_range CHECK (pax >= 0 AND pax <= 10),
  CONSTRAINT rsvp_attendance_status_check
    CHECK (attendance_status IN ('hadir', 'tidak_hadir')),
  CONSTRAINT rsvp_pax_matches_attendance CHECK (
    (attendance_status = 'tidak_hadir' AND pax = 0)
    OR (attendance_status = 'hadir' AND pax BETWEEN 1 AND 10)
  )
);

-- Unique normalized phone so duplicates can be detected and updated
CREATE UNIQUE INDEX IF NOT EXISTS rsvp_phone_unique_idx ON public.rsvp (phone);
CREATE INDEX IF NOT EXISTS rsvp_created_at_idx ON public.rsvp (created_at DESC);

-- -----------------------------------------------------------------------------
-- Wishes table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  message VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wishes_name_length CHECK (char_length(trim(name)) >= 2),
  CONSTRAINT wishes_message_length CHECK (
    char_length(trim(message)) >= 1
    AND char_length(message) <= 500
  )
);

CREATE INDEX IF NOT EXISTS wishes_created_at_idx ON public.wishes (created_at DESC);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

-- Remove any previous policies (safe to re-run)
DROP POLICY IF EXISTS "Allow anonymous insert rsvp" ON public.rsvp;
DROP POLICY IF EXISTS "Deny anonymous select rsvp" ON public.rsvp;
DROP POLICY IF EXISTS "Deny anonymous update rsvp" ON public.rsvp;
DROP POLICY IF EXISTS "Deny anonymous delete rsvp" ON public.rsvp;
DROP POLICY IF EXISTS "Allow anonymous insert wishes" ON public.wishes;
DROP POLICY IF EXISTS "Allow anonymous select wishes" ON public.wishes;
DROP POLICY IF EXISTS "Deny anonymous update wishes" ON public.wishes;
DROP POLICY IF EXISTS "Deny anonymous delete wishes" ON public.wishes;

-- RSVP: anonymous insert only (no public read/update/delete)
-- Duplicate checks & updates go through SECURITY DEFINER RPCs below.
CREATE POLICY "Allow anonymous insert rsvp"
  ON public.rsvp
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No SELECT / UPDATE / DELETE policies for anon on rsvp
-- (absence of policy = denied when RLS is enabled)

-- Wishes: anonymous insert + read; no update/delete
CREATE POLICY "Allow anonymous insert wishes"
  ON public.wishes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select wishes"
  ON public.wishes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- Secure RPCs for duplicate RSVP handling (no public RSVP reads)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_rsvp_phone(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_phone IS NULL OR length(trim(p_phone)) = 0 THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.rsvp
    WHERE phone = trim(p_phone)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_rsvp(
  p_name TEXT,
  p_phone TEXT,
  p_pax INTEGER,
  p_attendance_status TEXT,
  p_replace BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
  v_name TEXT := trim(p_name);
  v_phone TEXT := trim(p_phone);
  v_status TEXT := trim(p_attendance_status);
  v_pax INTEGER := p_pax;
BEGIN
  IF v_name IS NULL OR char_length(v_name) < 2 OR char_length(v_name) > 100 THEN
    RETURN json_build_object('status', 'error', 'message', 'Nama tidak sah.');
  END IF;

  IF v_phone IS NULL OR char_length(v_phone) < 9 OR char_length(v_phone) > 30 THEN
    RETURN json_build_object('status', 'error', 'message', 'Nombor telefon tidak sah.');
  END IF;

  IF v_status NOT IN ('hadir', 'tidak_hadir') THEN
    RETURN json_build_object('status', 'error', 'message', 'Status kehadiran tidak sah.');
  END IF;

  IF v_status = 'tidak_hadir' THEN
    v_pax := 0;
  ELSIF v_pax IS NULL OR v_pax < 1 OR v_pax > 10 THEN
    RETURN json_build_object('status', 'error', 'message', 'Jumlah kehadiran tidak sah.');
  END IF;

  SELECT id INTO v_existing_id
  FROM public.rsvp
  WHERE phone = v_phone
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    IF NOT COALESCE(p_replace, FALSE) THEN
      RETURN json_build_object('status', 'exists_no_replace');
    END IF;

    UPDATE public.rsvp
    SET
      name = v_name,
      pax = v_pax,
      attendance_status = v_status,
      updated_at = NOW()
    WHERE id = v_existing_id;

    RETURN json_build_object('status', 'updated', 'id', v_existing_id);
  END IF;

  INSERT INTO public.rsvp (name, phone, pax, attendance_status)
  VALUES (v_name, v_phone, v_pax, v_status)
  RETURNING id INTO v_existing_id;

  RETURN json_build_object('status', 'created', 'id', v_existing_id);
END;
$$;

-- Aggregated RSVP counts only (no row-level data exposed to clients)
CREATE OR REPLACE FUNCTION public.get_rsvp_counts()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT json_build_object(
    'hadir', COALESCE(SUM(CASE WHEN attendance_status = 'hadir' THEN pax ELSE 0 END), 0),
    'tidak_hadir', COALESCE(SUM(CASE WHEN attendance_status = 'tidak_hadir' THEN 1 ELSE 0 END), 0)
  )
  FROM public.rsvp;
$$;

-- Grant execute on RPCs to anonymous & authenticated clients
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rsvp_phone(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_rsvp(TEXT, TEXT, INTEGER, TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_rsvp_counts() TO anon, authenticated;

-- Table grants (RLS still applies)
GRANT INSERT ON public.rsvp TO anon, authenticated;
GRANT SELECT, INSERT ON public.wishes TO anon, authenticated;

-- =============================================================================
-- Notes for the couple / admin:
-- 1. Inspect RSVP rows in Supabase Dashboard → Table Editor → rsvp
--    (service role / dashboard bypasses RLS)
-- 2. Never put the service_role key in frontend code
-- 3. Re-run this file safely; policies are dropped/recreated
-- =============================================================================
