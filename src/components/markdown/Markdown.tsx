import type { ReactNode } from "react";

/**
 * Güvenli markdown renderer — KÜTÜPHANESİZ + dangerouslySetInnerHTML'SİZ (proje yasakları:
 * react-markdown, markdown-it, innerHTML). Markdown metnini React öğelerine çevirir.
 * Desteklenen: başlık, paragraf, kalın/italik, satır-içi kod, kod-bloğu, liste (ul/ol),
 * tablo, blockquote, yatay çizgi, link. Bare `*.md` linkleri uygulama-içi /docs rotasına gider.
 */

const INLINE = /(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)/;
const BARE_MD = /^[A-Za-z0-9._-]+\.md$/;

// Uygulama-içi /docs rotası tabanı (BASE_URL: Pages'te /actionplan/, yerelde /).
const DOCS_BASE = `${import.meta.env.BASE_URL || "/"}docs/`;

function renderLink(text: string, href: string, key: number): ReactNode {
  // Bare `<ad>.md` → uygulama-içi /docs rotası (router-bağımsız düz <a>, tam-gezinme).
  if (BARE_MD.test(href)) {
    return (
      <a
        key={key}
        href={`${DOCS_BASE}${href.replace(/\.md$/, "")}`}
        className="text-primary hover:underline"
      >
        {text}
      </a>
    );
  }
  return (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary hover:underline"
    >
      {text}
    </a>
  );
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest.length > 0) {
    const m = INLINE.exec(rest);
    if (!m) {
      out.push(rest);
      break;
    }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) {
      out.push(
        <code key={key++} className="rounded bg-secondary px-1 text-base">
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("[")) {
      const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
      out.push(lm ? renderLink(lm[1], lm[2], key++) : tok);
    } else if (tok.startsWith("**")) {
      out.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    } else {
      out.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    }
    rest = rest.slice(m.index + tok.length);
  }
  return out;
}

const cells = (line: string): string[] =>
  line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

const HEAD_CLASS = [
  "text-2xl font-semibold",
  "text-xl font-semibold",
  "text-lg font-medium",
  "font-medium",
  "font-medium",
  "font-medium",
];

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  const isListItem = (l: string) => /^[-*]\s+/.test(l) || /^\d+\.\s+/.test(l);
  const isSpecial = (l: string) =>
    l.startsWith("#") ||
    l.startsWith("```") ||
    l.startsWith(">") ||
    isListItem(l) ||
    /^\|.*\|$/.test(l.trim()) ||
    /^(-{3,}|\*{3,}|_{3,})$/.test(l.trim());

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <pre key={key++} className="overflow-x-auto rounded-md bg-secondary p-3 text-base">
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length;
      const cls = `mt-4 mb-2 ${HEAD_CLASS[lvl - 1]}`;
      const inner = inline(h[2]);
      if (lvl === 1)
        blocks.push(
          <h1 key={key++} className={cls}>
            {inner}
          </h1>,
        );
      else if (lvl === 2)
        blocks.push(
          <h2 key={key++} className={cls}>
            {inner}
          </h2>,
        );
      else if (lvl === 3)
        blocks.push(
          <h3 key={key++} className={cls}>
            {inner}
          </h3>,
        );
      else
        blocks.push(
          <h4 key={key++} className={cls}>
            {inner}
          </h4>,
        );
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="my-4 border-border" />);
      i++;
      continue;
    }
    if (
      /^\|.*\|$/.test(line.trim()) &&
      i + 1 < lines.length &&
      /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())
    ) {
      const header = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        rows.push(cells(lines[i]));
        i++;
      }
      blocks.push(
        <div key={key++} className="my-2 overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-border border-b text-left">
                {header.map((c, ci) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: statik tablo başlığı
                  <th key={ci} className="py-1 pr-3 font-medium">
                    {inline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: statik tablo satırı
                <tr key={ri} className="border-border border-b">
                  {r.map((c, ci) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: statik tablo hücresi
                    <td key={ci} className="py-1 pr-3 align-top">
                      {inline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (line.startsWith(">")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        q.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-2 border-border border-l-2 pl-3 text-muted-foreground"
        >
          {inline(q.join(" "))}
        </blockquote>,
      );
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-2 flex list-disc flex-col gap-1 pl-6">
          {items.map((it, ii) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: statik liste
            <li key={ii}>{inline(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="my-2 flex list-decimal flex-col gap-1 pl-6">
          {items.map((it, ii) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: statik liste
            <li key={ii}>{inline(it)}</li>
          ))}
        </ol>,
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !isSpecial(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-2 text-base leading-relaxed">
        {inline(para.join(" "))}
      </p>,
    );
  }
  return <div className="flex flex-col">{blocks}</div>;
}
