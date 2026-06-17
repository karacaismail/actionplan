import { cn } from "@/lib/cn";
import { STATUS_LABEL, STATUS_VAR, hslVar } from "@/lib/format";
import type { TaskStatus } from "@/schemas";
import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from "react";

/** Phosphor ikon (CDN web-font). */
export function Icon({
  name,
  className,
  style,
  title,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  return <i className={cn("ph", name, className)} style={style} title={title} aria-hidden="true" />;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md";
};
export function Button({ variant = "outline", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "tap-target inline-flex items-center justify-center gap-2 rounded-md font-normal transition-colors disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-base" : "px-4 py-2 text-base",
        variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90",
        variant === "outline" && "border border-border bg-card hover:bg-secondary",
        variant === "ghost" && "hover:bg-secondary",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-card text-card-foreground", className)}
      {...props}
    />
  );
}

export function Badge({
  children,
  color,
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  // Renk yalnız kenarlık/nokta için; metin daima yüksek-kontrast foreground (WCAG AA/AAA).
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-base text-foreground",
        className,
      )}
      style={color ? { borderColor: color } : undefined}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const color = hslVar(STATUS_VAR[status]);
  return (
    <Badge color={color}>
      <span className="size-2 rounded-full" style={{ background: color }} />
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-secondary"
      role="progressbar"
      aria-label={`İlerleme %${value}`}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${value}%`, background: color ?? hslVar("--primary") }}
      />
    </div>
  );
}
