import { Icon } from "@/components/ui/primitives";
import { t } from "@/lib/strings";
import { useTaskStore } from "@/store/taskStore";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

/** Global başlık araması — başlık/WBS koduna göre düğüm filtreler, sonuç → /task/<id>. */
export function HeaderSearch() {
  const nodes = useTaskStore((s) => s.nodes);
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    return nodes
      .filter(
        (n) => n.title.toLowerCase().includes(query) || n.wbsCode.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [q, nodes]);

  return (
    <div className="relative hidden sm:block">
      <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2">
        <Icon name="ph-magnifying-glass" className="text-base text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search.placeholder}
          aria-label={t.search.aria}
          className="w-44 bg-transparent py-2 text-base outline-none md:w-64"
        />
      </div>
      {results.length > 0 && (
        <ul
          aria-label={t.search.resultsAria}
          className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-border bg-card p-1 shadow-lg"
        >
          {results.map((n) => (
            <li key={n.id}>
              <Link
                to="/task/$taskId"
                params={{ taskId: n.id }}
                onClick={() => setQ("")}
                className="tap-target flex items-center gap-2 rounded-md px-2 py-2 text-base hover:bg-secondary"
              >
                <span className="font-mono text-muted-foreground tabular-nums">{n.wbsCode}</span>
                <span className="min-w-0 flex-1 truncate">{n.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
