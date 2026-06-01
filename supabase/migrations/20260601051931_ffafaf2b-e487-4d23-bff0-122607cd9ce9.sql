
-- =========================================================
-- Devgn PerformX — Phase 2a foundation
-- =========================================================

-- Roles enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'hod', 'team_lead', 'employee');

-- ---------------------------------------------------------
-- Departments
-- ---------------------------------------------------------
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  kpi_weight NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  job_title TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  phone TEXT,
  hire_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------
-- User roles
-- ---------------------------------------------------------
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------
-- Security definer helpers (avoid RLS recursion)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin')
      OR public.has_role(_user_id, 'hod')
      OR public.has_role(_user_id, 'team_lead');
$$;

-- ---------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_departments_updated
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------
-- RLS Policies — departments
-- ---------------------------------------------------------
CREATE POLICY "Authenticated can view departments"
  ON public.departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage departments"
  ON public.departments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ---------------------------------------------------------
-- RLS Policies — profiles
-- ---------------------------------------------------------
CREATE POLICY "Authenticated can view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ---------------------------------------------------------
-- RLS Policies — user_roles
-- ---------------------------------------------------------
CREATE POLICY "Users see own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers see all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_manager(auth.uid()));

CREATE POLICY "Admins manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ---------------------------------------------------------
-- Auto-provision profile + role on signup
-- First signup = super_admin; otherwise = employee
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _is_first BOOLEAN;
  _full_name TEXT;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO _is_first;

  _full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, _full_name, NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN _is_first THEN 'super_admin'::public.app_role ELSE 'employee'::public.app_role END);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------
-- Seed 12 departments
-- ---------------------------------------------------------
INSERT INTO public.departments (slug, name, description, icon, kpi_weight) VALUES
  ('hr',          'Human Resources', 'People operations, talent and culture',         'Users',         1.0),
  ('projects',    'Projects',        'Project delivery and program management',       'Briefcase',     1.2),
  ('finance',     'Finance',         'Financial planning, controlling and accounting','Banknote',      1.1),
  ('marketing',   'Marketing',       'Brand, growth and demand generation',           'Megaphone',     1.0),
  ('it',          'Information Tech','Engineering, infrastructure and security',      'Cpu',           1.2),
  ('legal',       'Legal',           'Compliance, contracts and risk',                'Scale',         0.9),
  ('operations',  'Operations',      'Day-to-day business operations',                'Settings',      1.1),
  ('crm',         'CRM',             'Customer relationship management',              'HeartHandshake',1.0),
  ('procurement', 'Procurement',     'Sourcing, vendors and supply chain',            'PackageSearch', 0.9),
  ('admin',       'Administration',  'Office, facilities and executive support',      'Building2',     0.8),
  ('sales',       'Sales',           'Revenue generation and account management',     'TrendingUp',    1.3),
  ('hospitality', 'Hospitality',     'Guest experience and service excellence',       'Hotel',         1.0);
