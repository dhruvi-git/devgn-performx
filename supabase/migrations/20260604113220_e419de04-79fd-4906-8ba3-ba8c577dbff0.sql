
REVOKE EXECUTE ON FUNCTION public.recalculate_performance_score(uuid, date, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_performance_score(uuid, date, date) TO service_role;
