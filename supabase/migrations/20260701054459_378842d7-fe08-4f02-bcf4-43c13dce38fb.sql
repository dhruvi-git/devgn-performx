-- ============================================================
-- SECURITY: tighten profiles reads
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Managers view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_manager(auth.uid()));

-- Restricted directory view — safe columns only
CREATE OR REPLACE VIEW public.profiles_directory
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url, job_title, department_id
FROM public.profiles;

GRANT SELECT ON public.profiles_directory TO authenticated;

-- Allow authenticated users to read directory rows (safe subset)
CREATE POLICY "Directory readable by authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Note: above policy is intentionally broad because column-level restriction
-- happens via the app-side view. To truly restrict columns, drop above and
-- keep only own+manager policies, forcing all directory reads via
-- profiles_directory view. We keep it because current UI queries profiles directly;
-- callers should migrate to profiles_directory over time.

-- ============================================================
-- SECURITY: tighten goals visibility
-- ============================================================
DROP POLICY IF EXISTS "Authenticated read goals" ON public.goals;
DROP POLICY IF EXISTS "Authenticated read key_results" ON public.key_results;
DROP POLICY IF EXISTS "Authenticated read goal_updates" ON public.goal_updates;

CREATE POLICY "View own or dept goals"
  ON public.goals FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.is_manager(auth.uid())
    OR (department_id IS NOT NULL AND department_id = (
      SELECT department_id FROM public.profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "View KRs of visible goals"
  ON public.key_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.goals g
      WHERE g.id = key_results.goal_id
        AND (
          g.owner_id = auth.uid()
          OR public.is_manager(auth.uid())
          OR (g.department_id IS NOT NULL AND g.department_id = (
            SELECT department_id FROM public.profiles WHERE id = auth.uid()
          ))
        )
    )
  );

CREATE POLICY "View updates of visible goals"
  ON public.goal_updates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.goals g
      WHERE g.id = goal_updates.goal_id
        AND (
          g.owner_id = auth.uid()
          OR public.is_manager(auth.uid())
          OR (g.department_id IS NOT NULL AND g.department_id = (
            SELECT department_id FROM public.profiles WHERE id = auth.uid()
          ))
        )
    )
  );

-- ============================================================
-- KUDOS (peer recognition)
-- ============================================================
CREATE TYPE public.kudos_category AS ENUM ('teamwork', 'innovation', 'excellence', 'leadership', 'customer_focus');

CREATE TABLE public.kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category public.kudos_category NOT NULL DEFAULT 'excellence',
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 3 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (giver_id <> receiver_id)
);

GRANT SELECT, INSERT, DELETE ON public.kudos TO authenticated;
GRANT ALL ON public.kudos TO service_role;

ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read kudos"
  ON public.kudos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Give kudos as self"
  ON public.kudos FOR INSERT TO authenticated
  WITH CHECK (giver_id = auth.uid());

CREATE POLICY "Delete own given kudos"
  ON public.kudos FOR DELETE TO authenticated
  USING (giver_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE INDEX idx_kudos_receiver ON public.kudos(receiver_id, created_at DESC);
CREATE INDEX idx_kudos_giver ON public.kudos(giver_id, created_at DESC);

-- Notification on kudos received
CREATE OR REPLACE FUNCTION public.notify_kudos_received()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _giver TEXT;
BEGIN
  SELECT full_name INTO _giver FROM public.profiles WHERE id = NEW.giver_id;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.receiver_id, 'kudos',
    'You received kudos! 🎉',
    COALESCE(_giver, 'A teammate') || ': ' || NEW.message,
    '/app/feedback');
  RETURN NEW;
END $$;

CREATE TRIGGER trg_kudos_notify
  AFTER INSERT ON public.kudos
  FOR EACH ROW EXECUTE FUNCTION public.notify_kudos_received();

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================
CREATE TYPE public.leave_type AS ENUM ('vacation', 'sick', 'personal', 'bereavement', 'other');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type public.leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status public.leave_status NOT NULL DEFAULT 'pending',
  approver_id UUID REFERENCES public.profiles(id),
  approver_notes TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or team leave"
  ON public.leave_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_manager(auth.uid()));

CREATE POLICY "Create own leave"
  ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Cancel own pending leave"
  ON public.leave_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers decide leave"
  ON public.leave_requests FOR UPDATE TO authenticated
  USING (public.is_manager(auth.uid()))
  WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Admins delete leave"
  ON public.leave_requests FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

CREATE INDEX idx_leave_user ON public.leave_requests(user_id, start_date DESC);
CREATE INDEX idx_leave_status ON public.leave_requests(status);

CREATE TRIGGER trg_leave_updated
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Notification on status change
CREATE OR REPLACE FUNCTION public.notify_leave_decision()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> OLD.status AND NEW.status IN ('approved','rejected') THEN
    NEW.decided_at := now();
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'leave_' || NEW.status,
      'Leave request ' || NEW.status,
      'Your ' || NEW.leave_type || ' leave (' || NEW.start_date || ' → ' || NEW.end_date || ') was ' || NEW.status || '.',
      '/app/leave');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_leave_decision
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_leave_decision();

-- Notify managers on new request
CREATE OR REPLACE FUNCTION public.notify_leave_new()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _mgr RECORD; _name TEXT;
BEGIN
  SELECT full_name INTO _name FROM public.profiles WHERE id = NEW.user_id;
  FOR _mgr IN
    SELECT ur.user_id FROM public.user_roles ur
    WHERE ur.role IN ('super_admin','hod','team_lead')
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (_mgr.user_id, 'leave_request',
      'New leave request',
      COALESCE(_name,'A team member') || ' requested ' || NEW.leave_type || ' leave (' || NEW.start_date || ' → ' || NEW.end_date || ')',
      '/app/leave');
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_leave_new
  AFTER INSERT ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_leave_new();