
-- GOALS
CREATE TYPE public.goal_status AS ENUM ('draft','active','at_risk','completed','cancelled');
CREATE TYPE public.kr_metric_type AS ENUM ('number','percent','boolean','currency');

CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  quarter SMALLINT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  year SMALLINT NOT NULL,
  status public.goal_status NOT NULL DEFAULT 'draft',
  progress NUMERIC(5,2) NOT NULL DEFAULT 0,
  weight NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_read_all_auth" ON public.goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "goals_insert_self_or_mgr" ON public.goals FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "goals_update_owner_or_mgr" ON public.goals FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_manager(auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "goals_delete_mgr" ON public.goals FOR DELETE TO authenticated
  USING (public.is_manager(auth.uid()));

CREATE TRIGGER goals_touch BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- KEY RESULTS
CREATE TABLE public.key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metric_type public.kr_metric_type NOT NULL DEFAULT 'number',
  start_value NUMERIC NOT NULL DEFAULT 0,
  target_value NUMERIC NOT NULL DEFAULT 100,
  current_value NUMERIC NOT NULL DEFAULT 0,
  progress NUMERIC(5,2) NOT NULL DEFAULT 0,
  status public.goal_status NOT NULL DEFAULT 'active',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.key_results TO authenticated;
GRANT ALL ON public.key_results TO service_role;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kr_read_all_auth" ON public.key_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "kr_write_owner_or_mgr" ON public.key_results FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id
    AND (g.owner_id = auth.uid() OR public.is_manager(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id
    AND (g.owner_id = auth.uid() OR public.is_manager(auth.uid()))));

CREATE TRIGGER kr_touch BEFORE UPDATE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- KR progress auto-compute + roll up to goal
CREATE OR REPLACE FUNCTION public.kr_compute_progress()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _span NUMERIC; _p NUMERIC;
BEGIN
  IF NEW.metric_type = 'boolean' THEN
    _p := CASE WHEN NEW.current_value >= NEW.target_value THEN 100 ELSE 0 END;
  ELSE
    _span := NULLIF(NEW.target_value - NEW.start_value, 0);
    IF _span IS NULL THEN
      _p := CASE WHEN NEW.current_value >= NEW.target_value THEN 100 ELSE 0 END;
    ELSE
      _p := GREATEST(0, LEAST(100, ROUND(((NEW.current_value - NEW.start_value) / _span) * 100, 2)));
    END IF;
  END IF;
  NEW.progress := _p;
  IF _p >= 100 THEN NEW.status := 'completed'; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER kr_compute_progress_trg BEFORE INSERT OR UPDATE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.kr_compute_progress();

CREATE OR REPLACE FUNCTION public.goal_rollup_progress()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _goal UUID; _avg NUMERIC;
BEGIN
  _goal := COALESCE(NEW.goal_id, OLD.goal_id);
  SELECT COALESCE(AVG(progress),0) INTO _avg FROM public.key_results WHERE goal_id = _goal;
  UPDATE public.goals SET progress = ROUND(_avg,2),
    status = CASE
      WHEN _avg >= 100 THEN 'completed'::public.goal_status
      WHEN _avg < 40 AND status NOT IN ('draft','cancelled') THEN 'at_risk'::public.goal_status
      WHEN status = 'draft' THEN 'active'::public.goal_status
      ELSE status END,
    updated_at = now()
  WHERE id = _goal;
  RETURN NULL;
END $$;

CREATE TRIGGER goal_rollup_trg AFTER INSERT OR UPDATE OR DELETE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.goal_rollup_progress();

-- GOAL UPDATES (check-ins)
CREATE TABLE public.goal_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  progress_snapshot NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_updates TO authenticated;
GRANT ALL ON public.goal_updates TO service_role;
ALTER TABLE public.goal_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gu_read_all_auth" ON public.goal_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "gu_insert_auth" ON public.goal_updates FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "gu_modify_author_or_mgr" ON public.goal_updates FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.is_manager(auth.uid()))
  WITH CHECK (author_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "gu_delete_author_or_mgr" ON public.goal_updates FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_manager(auth.uid()));

CREATE INDEX goals_owner_idx ON public.goals(owner_id);
CREATE INDEX goals_dept_qy_idx ON public.goals(department_id, year, quarter);
CREATE INDEX kr_goal_idx ON public.key_results(goal_id);
CREATE INDEX gu_goal_idx ON public.goal_updates(goal_id);
