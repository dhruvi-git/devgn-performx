import logo from "@/assets/devgn-logo.png";

type Props = { size?: number; withText?: boolean; className?: string };

export function Logo({ size = 40, withText = true, className = "" }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logo}
        alt="Devgn Cinex"
        width={size}
        height={size}
        className="rounded-md object-contain"
        style={{ filter: "drop-shadow(0 0 12px rgba(212,175,55,0.35))" }}
      />
      {withText && (
        <div className="leading-tight">
          <div className="font-display text-base tracking-widest text-gradient-gold">
            DEVGN PERFORMX
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Workforce Intelligence
          </div>
        </div>
      )}
    </div>
  );
}
