// @vitest-environment jsdom
import { Markdown } from "@/components/markdown/Markdown";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Güvenli markdown renderer (kütüphanesiz + dangerouslySetInnerHTML'siz). Yasak: react-markdown,
 * markdown-it, innerHTML. Markdown metnini React öğelerine çevirir; docs/*.md sitede okunur olur.
 */
describe("Markdown — güvenli React renderer", () => {
  it("başlık + kalın + liste + link + satır-içi kod (React öğesi, innerHTML yok)", () => {
    const { container, getByText, getByRole } = render(
      <Markdown
        source={
          "# Baslik\n\nbir **kalin** satir `kod`\n\n- madde bir\n- madde iki\n\n[git](https://example.io)"
        }
      />,
    );
    expect(container.querySelector("h1")?.textContent).toContain("Baslik");
    expect(container.querySelectorAll("li").length).toBe(2);
    expect(getByText("kalin").tagName).toBe("STRONG");
    expect(getByRole("link", { name: "git" }).getAttribute("href")).toBe("https://example.io");
    // güvenlik: hiçbir öğede dangerouslySetInnerHTML üretilmiş ham html olmamalı (script yok)
    expect(container.querySelector("script")).toBeNull();
  });

  it("tablo render eder (thead/tbody/th)", () => {
    const { container } = render(<Markdown source={"| A | B |\n| --- | --- |\n| 1 | 2 |"} />);
    expect(container.querySelector("table")).toBeTruthy();
    expect(container.querySelectorAll("th").length).toBe(2);
    expect(container.querySelectorAll("tbody tr").length).toBe(1);
  });

  it("kod bloğu (fence) render eder", () => {
    const { container } = render(<Markdown source={"```\nsatir1\nsatir2\n```"} />);
    expect(container.querySelector("pre code")?.textContent).toContain("satir1");
  });

  it("bare .md linki uygulama-içi /docs rotasına çevrilir", () => {
    const { getByRole } = render(<Markdown source={"[ADR](adr-0027-engineering-standards.md)"} />);
    const a = getByRole("link", { name: "ADR" });
    expect(a.getAttribute("href")).toContain("/docs/adr-0027-engineering-standards");
  });
});
