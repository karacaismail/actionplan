import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

/**
 * shadcn/ui deseni Badge — metin daima yüksek-kontrast foreground; renk yalnız kenarlık (WCAG AA/AAA).
 * `color` opsiyonel: durum/seviye rengi için kenarlık.
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string;
}

export function Badge({ className, color, style, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-base text-foreground",
        className,
      )}
      style={color ? { borderColor: color, ...style } : style}
      {...props}
    />
  );
}
