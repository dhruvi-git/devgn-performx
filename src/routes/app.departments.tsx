import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/app/Panels";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/departments")({
  head: () => ({ meta: [{ title: "Departments · PerformX" }] }),
  component: Departments,
});

type Dept = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kpi_weight: number;
};

function Departments() {
  const { data: depts, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const [{ data: d }, { data: p }] = await Promise.all([
        supabase
          .from("departments")
          .select("id, slug, name, description, kpi_weight")
          .order("name"),
        supabase.from("profiles").select("department_id"),
      ]);
      const counts = new Map<string, number>();
      (p ?? []).forEach((r) => {
        if (r.department_id)
          counts.set(r.department_id, (counts.get(r.department_id) ?? 0) + 1);
      });
      return ((d ?? []) as Dept[]).map((x) => ({
        ...x,
        employees: counts.get(x.id) ?? 0,
      }));
    },
  });

  return (
    <div className="p-8">
      <PageHeader
        eyebrow="Department Intelligence"
        title="Every team. One view."
        subtitle="Twelve departments, weighted KPIs and headcount — synchronized live."
      />
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-gold" /> Loading departments…
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(depts ?? []).map((d, i) => {
            const score = Math.round(70 + d.kpi_weight * 18);
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to="/app/departments/$slug"
                  params={{ slug: d.slug }}
                  className="block glass rounded-2xl p-5 group hover:border-gold/40 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="size-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
                      <Building2 className="size-5 text-gold" />
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-gold transition" />
                  </div>
                  <div className="font-display text-lg text-foreground">{d.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {d.employees} {d.employees === 1 ? "employee" : "employees"} ·
                    weight {d.kpi_weight.toFixed(1)}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-end justify-between mb-1.5">
                      <div className="text-xs text-muted-foreground">KPI score</div>
                      <div className="font-display text-2xl text-gradient-gold">{score}</div>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                      <div className="h-full bg-gradient-gold" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
