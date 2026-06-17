import { useTheme } from "@/components/theme/useTheme";
import { Button, Icon } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { t } from "@/lib/strings";
import { useTaskStore } from "@/store/taskStore";
import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";

const NAV = [
  { to: "/", label: t.nav.dashboard, icon: "ph-squares-four" },
  { to: "/wbs", label: t.nav.wbs, icon: "ph-tree-structure" },
  { to: "/board", label: t.nav.board, icon: "ph-kanban" },
  { to: "/graph", label: t.nav.graph, icon: "ph-graph" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const loading = useTaskStore((s) => s.loading);

  // rota değişince mobil çekmeceyi kapat
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="flex h-[100dvh] flex-col">
      <a href="#main" className="skip-link">
        {t.skipToContent}
      </a>

      {/* Üst bar (mobile-first) — sabit yükseklikli kolon başı */}
      <header className="z-30 flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          aria-label="Menü"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name="ph-list" className="text-xl" />
        </Button>
        <Link to="/" className="flex items-center gap-2 font-medium">
          <Icon name="ph-strategy" className="text-2xl text-primary" />
          <span>{t.appTitle}</span>
          <span className="hidden text-base text-muted-foreground sm:inline">· {t.appSubtitle}</span>
        </Link>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" aria-label={t.actions.toggleTheme} onClick={toggle}>
            <Icon name={theme === "dark" ? "ph-sun" : "ph-moon"} className="text-xl" />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Kenar çubuğu — masaüstü sticky (kendi scroll'u), mobil off-canvas */}
        {open && (
          <button
            type="button"
            aria-label="Kapat"
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
        <nav
          aria-label="Ana gezinme"
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto border-r border-border bg-card p-3 pt-16 transition-transform md:static md:z-0 md:translate-x-0 md:pt-4",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="tap-target flex items-center gap-3 rounded-md px-3 py-2 text-base hover:bg-secondary [&.active]:bg-secondary [&.active]:font-medium"
                  activeOptions={{ exact: item.to === "/" }}
                >
                  <Icon name={item.icon} className="text-xl text-primary" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main id="main" className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="grid h-full place-items-center text-base text-muted-foreground">
              <span className="flex items-center gap-2">
                <Icon name="ph-circle-notch" className="animate-spin text-xl" /> Veri yükleniyor…
              </span>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
