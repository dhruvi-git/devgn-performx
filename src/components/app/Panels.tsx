import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function PageHeader({ eyebrow, title, subtitle, actions }: {
  eyebrow?: string; title: string; subtitle?: string; actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        {eyebrow && <div className="text-xs uppercase tracking-[0.25em] text-gold mb-2">{eyebrow}</div>}
        <h1 className="font-display text-3xl md:text-4xl text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function KpiCard({
  label, value, delta, icon: Icon, accent,
}: {
  label: string; value: string; delta?: string; icon?: LucideIcon; accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl p-5 ${accent ? "gold-glow" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        {Icon && (
          <div className="size-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
            <Icon className="size-4 text-gold" />
          </div>
        )}
      </div>
      <div className="font-display text-3xl text-foreground mt-3">{value}</div>
      {delta && <div className="text-xs text-gold mt-1">{delta}</div>}
    </motion.div>
  );
}

export function Panel({ title, children, className = "", actions }: {
  title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode;
}) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-display text-base text-foreground">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
