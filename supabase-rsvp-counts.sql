-- Run this in Supabase SQL Editor if the main schema was already applied.
-- Exposes only aggregate Hadir / Tidak hadir counts (no guest rows).

CREATE OR REPLACE FUNCTION public.get_rsvp_counts()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT json_build_object(
    'hadir', COALESCE(SUM(CASE WHEN attendance_status = 'hadir' THEN 1 ELSE 0 END), 0),
    'tidak_hadir', COALESCE(SUM(CASE WHEN attendance_status = 'tidak_hadir' THEN 1 ELSE 0 END), 0)
  )
  FROM public.rsvp;
$$;

GRANT EXECUTE ON FUNCTION public.get_rsvp_counts() TO anon, authenticated;
