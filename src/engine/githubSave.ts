/**
 * Frontend-only persistence: kullanıcının KENDİ PAT'ı ile GitHub'a commit.
 * Gömülü secret YOK — token runtime'da girilir, yalnız sessionStorage'da tutulur.
 */
export interface GitHubTarget {
  token: string;
  owner: string;
  repo: string;
  path: string;
  branch?: string;
}

export interface SaveResult {
  ok: boolean;
  detail: string;
  url?: string;
}

/** UTF-8 güvenli base64 (GitHub contents API base64 ister). */
export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** PUT gövdesini kurar (saf — test edilebilir). */
export function buildCommitBody(
  content: string,
  message: string,
  branch: string,
  sha?: string,
): Record<string, string> {
  const body: Record<string, string> = { message, content: toBase64(content), branch };
  if (sha) body.sha = sha;
  return body;
}

const TOKEN_KEY = "actionplan-gh-token";
export function rememberToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* yok say */
  }
}
export function recallToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Verilen içeriği hedef repodaki path'e commit eder (varsa sha ile günceller). */
export async function saveToGitHub(
  target: GitHubTarget,
  content: string,
  message: string,
): Promise<SaveResult> {
  const { token, owner, repo, path, branch = "main" } = target;
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  let sha: string | undefined;
  try {
    const cur = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers });
    if (cur.ok) sha = ((await cur.json()) as { sha?: string }).sha;
  } catch {
    /* dosya yok → yeni oluşturulur */
  }

  try {
    const res = await fetch(api, {
      method: "PUT",
      headers,
      body: JSON.stringify(buildCommitBody(content, message, branch, sha)),
    });
    const json = (await res.json().catch(() => ({}))) as {
      message?: string;
      content?: { html_url?: string };
    };
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status} — ${json.message ?? ""}` };
    return { ok: true, detail: `HTTP ${res.status}`, url: json.content?.html_url };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
}
