import { Logo } from "@/components/brand/Logo";
import { Link } from "@tanstack/react-router";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-surface">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/10 blur-[100px]" />
        <div className="relative">
          <Link to="/"><Logo /></Link>
        </div>
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.3em] text-gold mb-4">Enterprise OS</div>
          <h2 className="font-display text-4xl text-foreground leading-tight">
            Workforce intelligence,<br />
            <span className="text-gradient-gold">cinematically delivered.</span>
          </h2>
          <p className="mt-5 text-sm text-muted-foreground max-w-md">
            The luxury performance, KPI and AI analytics platform for Devgn Cinex leadership.
          </p>
        </div>
        <div className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} Devgn Cinex
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="lg:hidden mb-8">
          <Link to="/"><Logo /></Link>
        </div>
        <div className="max-w-md w-full mx-auto">
          <div className="glass-elevated rounded-3xl p-8 gold-glow">
            <h1 className="font-display text-2xl text-gradient-gold">{title}</h1>
            <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function Field({
  label, type = "text", value, onChange, placeholder, required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-lg bg-surface/60 border border-gold/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20 transition"
      />
    </label>
  );
}
