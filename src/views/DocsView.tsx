import { Markdown } from "@/components/markdown/Markdown";
import { Button, Card, Icon } from "@/components/ui/primitives";
import { downloadFile } from "@/engine";
import { t } from "@/lib/strings";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";

// Vite tüm docs/*.md dosyalarını ham metin olarak pakete gömer (build'e girer; çalışma anında
// fetch yok, GitHub'a gidilmez). BASE_URL'den bağımsız, derleme-zamanı statik içerik.
const MODULES = import.meta.glob("/docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

interface DocEntry {
  slug: string;
  title: string;
  content: string;
}

// Dosya adından slug + ilk H1'den başlık çıkar. README en üstte, gerisi başlığa göre sıralı.
const DOCS: DocEntry[] = Object.entries(MODULES)
  .map(([path, content]) => {
    const slug = path.replace(/^.*\//, "").replace(/\.md$/, "");
    const h1 = /^#\s+(.+)$/m.exec(content);
    return { slug, title: h1 ? h1[1].trim() : slug, content };
  })
  .sort((a, b) => {
    if (a.slug === "README") return -1;
    if (b.slug === "README") return 1;
    return a.title.localeCompare(b.title, "tr");
  });

const BY_SLUG = new Map(DOCS.map((d) => [d.slug, d]));

export function DocsView() {
  // /docs (paramsız) → README; /docs/$docSlug → ilgili belge.
  const { docSlug } = useParams({ strict: false }) as { docSlug?: string };
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const active = useMemo(
    () => BY_SLUG.get(docSlug ?? "README") ?? BY_SLUG.get("README") ?? DOCS[0],
    [docSlug],
  );

  if (!active) return null;

  const copyMarkdown = () => {
    navigator.clipboard?.writeText(active.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const exportOne = () =>
    downloadFile(
      `${active.slug}.json`,
      JSON.stringify({ slug: active.slug, title: active.title, markdown: active.content }, null, 2),
      "application/json",
    );
  const exportAll = () =>
    downloadFile(
      "actionplan-docs.json",
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          count: DOCS.length,
          docs: DOCS.map((d) => ({ slug: d.slug, title: d.title, markdown: d.content })),
        },
        null,
        2,
      ),
      "application/json",
    );

  return (
    <div className="mx-auto flex max-w-6xl gap-4">
      <nav aria-label={t.docs.listAria} className="hidden w-64 shrink-0 md:block">
        <h2 className="mb-1 flex items-center gap-2 font-medium">
          <Icon name="ph-books" className="text-primary" /> {t.docs.title}
        </h2>
        <p className="mb-3 text-sm text-muted">{t.docs.subtitle}</p>
        <ul className="flex flex-col gap-0.5">
          {DOCS.map((d) => (
            <li key={d.slug}>
              <Link
                to="/docs/$docSlug"
                params={{ docSlug: d.slug }}
                className="tap-target block truncate rounded-md px-2 py-1 text-base hover:bg-secondary [&.active]:bg-secondary [&.active]:font-medium"
              >
                {d.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 flex-1">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-xl font-medium">{active.title}</h1>
          <Button type="button" variant="outline" size="sm" onClick={copyMarkdown}>
            <Icon name="ph-copy" /> {copied ? t.docs.copied : t.docs.copy}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={exportOne}>
            <Icon name="ph-brackets-curly" /> {t.docs.exportOne}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={exportAll}>
            <Icon name="ph-download-simple" /> {t.docs.exportAll}
          </Button>
        </div>

        <div className="mb-3 md:hidden">
          <label htmlFor="docSel" className="sr-only">
            {t.docs.selectAria}
          </label>
          <select
            id="docSel"
            value={active.slug}
            onChange={(e) =>
              navigate({ to: "/docs/$docSlug", params: { docSlug: e.target.value } })
            }
            className="tap-target w-full rounded-md border border-border bg-card px-2 py-2 text-base"
          >
            {DOCS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.title}
              </option>
            ))}
          </select>
        </div>

        <Card className="p-4 md:p-6">
          <Markdown source={active.content} />
        </Card>
      </div>
    </div>
  );
}
