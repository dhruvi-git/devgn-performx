
-- ============ TASKS ============
CREATE TYPE public.task_status AS ENUM ('todo','in_progress','review','done');
CREATE TYPE public.task_priority AS ENUM ('low','medium','high','critical');

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  weight numeric NOT NULL DEFAULT 1.0,
  progress int NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  due_date timestamptz,
  completed_at timestamptz,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own/assigned tasks" ON public.tasks FOR SELECT TO authenticated
  USING (assignee_id = auth.uid() OR created_by = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "Managers insert tasks" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_manager(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "Assignee or manager update" ON public.tasks FOR UPDATE TO authenticated
  USING (assignee_id = auth.uid() OR created_by = auth.uid() OR public.is_manager(auth.uid()))
  WITH CHECK (assignee_id = auth.uid() OR created_by = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "Managers delete tasks" ON public.tasks FOR DELETE TO authenticated
  USING (public.is_manager(auth.uid()) OR created_by = auth.uid());

CREATE TRIGGER tasks_touch BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX tasks_assignee_idx ON public.tasks(assignee_id);
CREATE INDEX tasks_department_idx ON public.tasks(department_id);
CREATE INDEX tasks_status_idx ON public.tasks(status);

-- ============ TASK COMMENTS ============
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_comments TO authenticated;
GRANT ALL ON public.task_comments TO service_role;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View comments on accessible tasks" ON public.task_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id
    AND (t.assignee_id = auth.uid() OR t.created_by = auth.uid() OR public.is_manager(auth.uid()))));
CREATE POLICY "Insert own comments" ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "Delete own comments" ON public.task_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_admin(auth.uid()));

-- ============ PERFORMANCE SCORES ============
CREATE TABLE public.performance_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  tasks_completed int NOT NULL DEFAULT 0,
  total_weight numeric NOT NULL DEFAULT 0,
  on_time_rate numeric NOT NULL DEFAULT 0,
  quality_score numeric NOT NULL DEFAULT 0,
  final_score numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start, period_end)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_scores TO authenticated;
GRANT ALL ON public.performance_scores TO service_role;
ALTER TABLE public.performance_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own scores" ON public.performance_scores FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "Admins manage scores" ON public.performance_scores FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER perf_touch BEFORE UPDATE ON public.performance_scores
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SCORING FUNCTION ============
CREATE OR REPLACE FUNCTION public.recalculate_performance_score(
  _user_id uuid, _period_start date, _period_end date
) RETURNS public.performance_scores
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _completed int;
  _weight numeric;
  _on_time numeric;
  _quality numeric;
  _final numeric;
  _dept_weight numeric;
  _row public.performance_scores;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(weight),0),
    CASE WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND (due_date IS NULL OR completed_at <= due_date)))::numeric
        / COUNT(*)::numeric END,
    COALESCE(AVG(progress),0)
  INTO _completed, _weight, _on_time, _quality
  FROM public.tasks
  WHERE assignee_id = _user_id
    AND status = 'done'
    AND completed_at::date BETWEEN _period_start AND _period_end;

  SELECT COALESCE(d.kpi_weight, 1.0) INTO _dept_weight
  FROM public.profiles p LEFT JOIN public.departments d ON d.id = p.department_id
  WHERE p.id = _user_id;

  _final := ROUND(((_weight * 0.5) + (_on_time * 100 * 0.3) + (_quality * 0.2)) * _dept_weight, 2);

  INSERT INTO public.performance_scores
    (user_id, period_start, period_end, tasks_completed, total_weight, on_time_rate, quality_score, final_score)
  VALUES (_user_id, _period_start, _period_end, _completed, _weight, _on_time, _quality, _final)
  ON CONFLICT (user_id, period_start, period_end) DO UPDATE
  SET tasks_completed = EXCLUDED.tasks_completed,
      total_weight = EXCLUDED.total_weight,
      on_time_rate = EXCLUDED.on_time_rate,
      quality_score = EXCLUDED.quality_score,
      final_score = EXCLUDED.final_score,
      updated_at = now()
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

-- Auto-set completed_at when status -> done
CREATE OR REPLACE FUNCTION public.tasks_set_completed_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done' THEN
    NEW.completed_at := now();
    NEW.progress := 100;
  ELSIF NEW.status <> 'done' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_completion BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.tasks_set_completed_at();
