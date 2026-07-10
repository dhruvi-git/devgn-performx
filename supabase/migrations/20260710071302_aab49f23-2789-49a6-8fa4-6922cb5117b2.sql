
-- Tighten RLS: remove overly-permissive "read all authenticated" policies
DROP POLICY IF EXISTS "gu_read_all_auth" ON public.goal_updates;
DROP POLICY IF EXISTS "goals_read_all_auth" ON public.goals;
DROP POLICY IF EXISTS "kr_read_all_auth" ON public.key_results;

-- Restrict profiles directory read: remove blanket authenticated SELECT.
-- Users can still see their own row and managers see all (existing policies).
DROP POLICY IF EXISTS "Directory readable by authenticated" ON public.profiles;

-- Expose safe columns via the profiles_directory view so cross-team pickers still work
GRANT SELECT ON public.profiles_directory TO authenticated;

-- Scope kudos visibility: giver, receiver, same-department teammates, or managers
DROP POLICY IF EXISTS "Authenticated read kudos" ON public.kudos;
CREATE POLICY "Kudos visible to involved or teammates"
  ON public.kudos FOR SELECT
  TO authenticated
  USING (
    giver_id = auth.uid()
    OR receiver_id = auth.uid()
    OR public.is_manager(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles viewer
      JOIN public.profiles recv ON recv.id = kudos.receiver_id
      WHERE viewer.id = auth.uid()
        AND viewer.department_id IS NOT NULL
        AND viewer.department_id = recv.department_id
    )
  );
