import { STATUS_LABEL, STATUS_VAR, hslVar } from "@/lib/format";
import { t } from "@/lib/strings";
import type { TaskStatus } from "@/schemas";
import { cn } from "@/lib/cn";
import type { CSSProperties } from "react";

// Bağımsız shadcn/ui bileşenleri (button/badge/card/dialog/tabs) ayrı dosyalarda;
// burada yeniden dışa aktarılır + uygulamaya özel Icon/ProgressBar/StatusBadge tanımlanır.
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";
export { Badge } from "./badge";
export type { BadgeProps } from "./badge";
export { Card, CardHeader, CardTitle, CardContent } from "./card";
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./dialog";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

import { Badge } from "./badge";

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
      aria-label={`${t.a11y.progressOf} %${value}`}
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
