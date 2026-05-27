import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";
import {
  Activity, Brain, BarChart3, Users, Shield, Sparkles, TrendingUp, Zap, ArrowRight, CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { monthlyTrend, departmentScores, revenueTrend } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Devgn PerformX — AI-Powered Workforce Intelligence" },
      {
        name: "description",
        content:
          "Luxury enterprise OS for workforce intelligence, KPI tracking and AI-powered performance management — built for Devgn Cinex leadership.",
      },
      { property: "og:title", content: "Devgn PerformX" },
      { property: "og:description", content: "AI-Powered Workforce Intelligence." },
    ],
  }),
  component: Landing,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const },
};

function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto mt-4 max-w-7xl px-6">
        <div className="glass rounded-2xl px-5 py-3 flex items-center justify-between">
          <Logo size={36} />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-gold transition">Features</a>
            <a href="#departments" className="hover:text-gold transition">Departments</a>
            <a href="#ai" className="hover:text-gold transition">AI</a>
            <a href="#dashboard" className="hover:text-gold transition">Dashboard</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-foreground/80 hover:text-gold transition">Sign in</Link>
            <Link
              to="/signup"
              className="rounded-lg bg-gradient-gold px-4 py-2 text-sm font-medium text-primary-foreground gold-glow hover:gold-glow-lg transition"
            >
              Request access
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative pt-40 pb-24 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gold/10 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-gold mb-8">
            <Sparkles className="size-3" /> Devgn Cinex · Enterprise OS
          </div>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] text-foreground">
            AI-Powered <span className="text-gradient-gold">Workforce</span>
            <br /> Intelligence Platform
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            One luxury command center for performance, productivity, KPIs and people analytics.
            Built for executives who lead at the speed of intelligence.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3 text-sm font-medium text-primary-foreground gold-glow-lg"
            >
              Launch PerformX <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl glass px-6 py-3 text-sm text-foreground hover:border-gold/40"
            >
              Live demo
            </Link>
          </div>
        </motion.div>

        {/* Floating dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative mt-20 mx-auto max-w-6xl"
        >
          <div className="glass-elevated rounded-3xl p-6 gold-glow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Executive overview</div>
                <div className="font-display text-2xl text-gradient-gold mt-1">Company Health · 91.4</div>
              </div>
              <div className="flex gap-2">
                <span className="size-2 rounded-full bg-destructive/60" />
                <span className="size-2 rounded-full bg-gold/60" />
                <span className="size-2 rounded-full bg-emerald-400/60" />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <StatCard label="Active employees" value="1,284" delta="+4.2%" />
              <StatCard label="Avg KPI score" value="88.7" delta="+1.8" />
              <StatCard label="Productivity" value="93%" delta="+12%" />
            </div>
            <div className="mt-5 grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 glass rounded-2xl p-4 h-64">
                <div className="text-xs text-muted-foreground mb-2">Revenue vs target</div>
                <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#E8C66B" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} />
                    <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #D4AF3755", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fill="url(#g1)" strokeWidth={2} />
                    <Area type="monotone" dataKey="target" stroke="#9A7B22" fill="none" strokeDasharray="4 4" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="glass rounded-2xl p-4 h-64 flex flex-col">
                <div className="text-xs text-muted-foreground mb-2">Workforce score</div>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="60%" outerRadius="100%" data={[{ name: "score", value: 91 }]} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" background={{ fill: "#1a1a1a" }} fill="#D4AF37" cornerRadius={20} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="absolute -top-6 -left-6 hidden lg:block glass-elevated rounded-2xl p-4 w-56 gold-glow">
            <div className="text-xs text-muted-foreground">AI Insight</div>
            <div className="font-display text-sm text-gradient-gold mt-1">Productivity up 12%</div>
            <div className="text-xs text-muted-foreground mt-1">Driven by IT & Sales teams.</div>
          </div>
          <div className="absolute -bottom-6 -right-6 hidden lg:block glass-elevated rounded-2xl p-4 w-56 gold-glow">
            <div className="text-xs text-muted-foreground">Top performer</div>
            <div className="font-display text-sm text-gradient-gold mt-1">Aarav Mehta · 96</div>
            <div className="text-xs text-muted-foreground mt-1">Projects · +4 MoM</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StatCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl text-foreground mt-1">{value}</div>
      <div className="text-xs text-gold mt-1">{delta}</div>
    </div>
  );
}

const features = [
  { icon: Brain, title: "AI Workforce Intelligence", desc: "Real-time insights, anomaly detection and performance prediction across every department." },
  { icon: BarChart3, title: "Executive KPI Dashboards", desc: "Live KPI tracking, heatmaps and weighted performance scoring built for leadership." },
  { icon: Users, title: "HOD & Team Command", desc: "Approvals, rankings, monthly reviews and team productivity at a glance." },
  { icon: Activity, title: "Performance Engine", desc: "Auto-weighted scores across attendance, output, discipline, innovation and collaboration." },
  { icon: Shield, title: "Role-Based Access", desc: "Super Admin, HOD, Team Lead, Employee — secure scoped views and approvals." },
  { icon: Zap, title: "Cinematic Experience", desc: "Glassmorphism, gold accents, smooth transitions — a billion-dollar interface." },
];

function Features() {
  return (
    <section id="features" className="py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs uppercase tracking-[0.25em] text-gold mb-4">The Platform</div>
          <h2 className="font-display text-4xl md:text-5xl text-foreground">
            One enterprise OS for <span className="text-gradient-gold">every leader</span>.
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="glass rounded-2xl p-6 hover:border-gold/40 transition group"
            >
              <div className="size-11 rounded-xl bg-gradient-gold/10 border border-gold/30 flex items-center justify-center mb-5 group-hover:gold-glow transition">
                <f.icon className="size-5 text-gold" />
              </div>
              <h3 className="font-display text-lg text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Departments() {
  return (
    <section id="departments" className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.03] to-transparent" />
      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div {...fadeUp} className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-gold mb-4">Department Intelligence</div>
            <h2 className="font-display text-4xl md:text-5xl text-foreground">
              Every team. <span className="text-gradient-gold">One score.</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Compare HR, Sales, Projects, IT, Finance, Marketing, Legal, Operations, CRM,
              Procurement, Admin and Hospitality in a single luxury view — with AI generating
              monthly reports automatically.
            </p>
            <ul className="mt-8 space-y-3">
              {["Weighted department scores", "Cross-department benchmarking", "Live KPI tracking", "Auto monthly reports"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm text-foreground/90">
                  <CheckCircle2 className="size-4 text-gold" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-elevated rounded-3xl p-6 gold-glow">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Department scores · live</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={departmentScores} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#666" fontSize={11} />
                <YAxis type="category" dataKey="dept" stroke="#999" fontSize={11} width={80} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #D4AF3755", borderRadius: 8 }} />
                <Bar dataKey="score" fill="#D4AF37" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function KPIShowcase() {
  return (
    <section id="dashboard" className="py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs uppercase tracking-[0.25em] text-gold mb-4">KPI Tracking</div>
          <h2 className="font-display text-4xl md:text-5xl text-foreground">
            See performance <span className="text-gradient-gold">in motion</span>.
          </h2>
        </motion.div>
        <motion.div {...fadeUp} className="glass-elevated rounded-3xl p-8 gold-glow-lg">
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <StatCard label="Avg productivity" value="93%" delta="+12% MoM" />
            <StatCard label="On-time tasks" value="87%" delta="+5%" />
            <StatCard label="KPI achievers" value="74%" delta="+9%" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g3" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#E8C66B" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#E8C66B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #D4AF3755", borderRadius: 8 }} />
              <Area type="monotone" dataKey="performance" stroke="#D4AF37" fill="url(#g2)" strokeWidth={2} />
              <Area type="monotone" dataKey="productivity" stroke="#E8C66B" fill="url(#g3)" strokeWidth={2} />
              <Area type="monotone" dataKey="attendance" stroke="#9A7B22" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </section>
  );
}

function AISection() {
  return (
    <section id="ai" className="py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gold/5 blur-[100px]" />
      <div className="relative mx-auto max-w-5xl px-6">
        <motion.div {...fadeUp} className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.25em] text-gold mb-4">AI Intelligence</div>
          <h2 className="font-display text-4xl md:text-5xl text-foreground">
            Ask. <span className="text-gradient-gold">Decide. Lead.</span>
          </h2>
          <p className="mt-5 text-muted-foreground max-w-xl mx-auto">
            Your AI workforce co-pilot answers in plain English — and generates monthly executive
            summaries automatically.
          </p>
        </motion.div>
        <motion.div {...fadeUp} className="glass-elevated rounded-3xl p-8 gold-glow">
          <div className="space-y-4">
            {[
              { q: "Who are the top performers this month?", a: "Aarav Mehta (Projects · 96), Priya Singh (Sales · 94), Rohan Kapoor (IT · 93)." },
              { q: "Which department has low productivity?", a: "Legal is trailing at 82 — recommend redistributing 2 active matters and a wellness check." },
              { q: "Show attendance anomalies", a: "Hospitality dipped 4% in week 2. 3 employees flagged for early-burnout signals." },
            ].map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-2"
              >
                <div className="glass rounded-xl px-4 py-3 max-w-md ml-auto text-sm">{m.q}</div>
                <div className="rounded-xl px-4 py-3 max-w-lg text-sm border border-gold/30 bg-gold/5 text-foreground/90">
                  <div className="flex items-center gap-2 text-xs text-gold mb-1">
                    <Sparkles className="size-3" /> PerformX AI
                  </div>
                  {m.a}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-32">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div {...fadeUp} className="glass-elevated rounded-3xl p-12 md:p-16 text-center gold-glow-lg relative overflow-hidden">
          <div className="absolute inset-0 shimmer opacity-30" />
          <div className="relative">
            <TrendingUp className="size-10 text-gold mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl text-foreground">
              Lead with <span className="text-gradient-gold">intelligence</span>.
            </h2>
            <p className="mt-5 text-muted-foreground max-w-xl mx-auto">
              Devgn PerformX is the operating system for the next era of Devgn Cinex.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link to="/signup" className="rounded-xl bg-gradient-gold px-7 py-3 text-sm font-medium text-primary-foreground gold-glow-lg">
                Get started
              </Link>
              <Link to="/login" className="rounded-xl glass px-7 py-3 text-sm text-foreground">
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gold/15 py-10">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo size={32} />
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Devgn Cinex · PerformX. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Features />
        <Departments />
        <KPIShowcase />
        <AISection />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
