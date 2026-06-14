CREATE TYPE public.attendance_status AS ENUM ('present', 'late', 'absent', 'remote', 'leave');

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  check_in timestamptz,
  check_out timestamptz,
  status public.attendance_status NOT NULL DEFAULT 'present',
  hours_worked numeric(5,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, work_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own attendance" ON public.attendance FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "Users insert own attendance" ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own attendance" ON public.attendance FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "Managers delete attendance" ON public.attendance FOR DELETE TO authenticated
  USING (public.is_manager(auth.uid()));

CREATE TRIGGER attendance_touch_updated_at BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.attendance_compute_hours()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.check_in IS NOT NULL AND NEW.check_out IS NOT NULL THEN
    NEW.hours_worked := ROUND(EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600.0, 2);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER attendance_hours_trigger BEFORE INSERT OR UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.attendance_compute_hours();

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_unread_idx ON public.notifications (user_id, read_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Managers create notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_manager(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Users mark own read" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users delete own" ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());