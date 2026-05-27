import { createFileRoute } from "@tanstack/react-router";
import { Building2, ArrowRight } from "lucide-react";
import { PageHeader, Panel } from "@/components/app/Panels";
import { departmentScores } from "@/lib/mock-data";

export const Route = createFileRoute("/app/departments")({
  head: () => ({ meta: [{ title: "Departments · PerformX" }] }),
  component: Departments,
});

const ALL = [
  "HR", "Projects", "Finance", "Marketing", "IT", "Legal",
  "Operations", "CRM", "Procurement", "Admin", "Sales", "Hospitality",
];

function Departments() {
  return (
    <div className="p-8">
      <PageHeader
        eyebrow="Department Intelligence"
        title="Every team. One view."
        subtitle="Twelve departments, weighted scores and KPI tracking — fully synchronized."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ALL.map((d) => {
          const data = departmentScores.find((x) => x.dept === d);
          const score = data?.score ?? 80 + Math.floor(Math.random() * 15);
          const emp = data?.employees ?? 10 + Math.floor(Math.random() * 30);
          return (
            <Panel key={d} className="group hover:border-gold/40 transition cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="size-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
                  <Building2 className="size-5 text-gold" />
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-gold transition" />
              </div>
              <div className="font-display text-lg text-foreground">{d}</div>
              <div className="text-xs text-muted-foreground mt-1">{emp} employees</div>
              <div className="mt-4">
                <div className="flex items-end justify-between mb-1.5">
                  <div className="text-xs text-muted-foreground">KPI score</div>
                  <div className="font-display text-2xl text-gradient-gold">{score}</div>
                </div>
                <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                  <div className="h-full bg-gradient-gold" style={{ width: `${score}%` }} />
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
