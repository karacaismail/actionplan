import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Icon,
} from "@/components/ui/primitives";
import { exportJSON, recallToken, rememberToken, saveToGitHub } from "@/engine";
import { t } from "@/lib/strings";
import { useTaskStore } from "@/store/taskStore";
import { useState } from "react";

/** Frontend-only persistence: kullanıcının PAT'ı ile mevcut veri setini repoya commit eder. */
export function GitHubSaveDialog() {
  const nodes = useTaskStore((s) => s.nodes);
  const [token, setToken] = useState(recallToken);
  const [owner, setOwner] = useState("karacaismail");
  const [repo, setRepo] = useState("actionplan");
  const [filePath, setFilePath] = useState("src/data/imported/dataset.json");
  const [branch, setBranch] = useState("main");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; detail: string; url?: string } | null>(null);

  const field = "tap-target w-full rounded-md border border-input bg-card px-3 py-2 text-base";

  async function onSave() {
    setBusy(true);
    setResult(null);
    rememberToken(token);
    const r = await saveToGitHub(
      { token, owner, repo, path: filePath, branch },
      exportJSON(nodes),
      t.github.commitMessage,
    );
    setResult(r);
    setBusy(false);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <Icon name="ph-github-logo" /> {t.github.open}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>
          <Icon name="ph-github-logo" className="text-primary" /> {t.github.title}
        </DialogTitle>
        <DialogDescription>{t.github.hint}</DialogDescription>

        <label className="flex flex-col gap-1 text-base">
          {t.github.token}
          <input
            type="password"
            className={field}
            value={token}
            placeholder={t.github.tokenPlaceholder}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-base">
            {t.github.owner}
            <input className={field} value={owner} onChange={(e) => setOwner(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-base">
            {t.github.repo}
            <input className={field} value={repo} onChange={(e) => setRepo(e.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <label className="flex flex-col gap-1 text-base">
            {t.github.path}
            <input className={field} value={filePath} onChange={(e) => setFilePath(e.target.value)} />
          </label>
          <label className="flex w-24 flex-col gap-1 text-base">
            {t.github.branch}
            <input className={field} value={branch} onChange={(e) => setBranch(e.target.value)} />
          </label>
        </div>

        {result && (
          <p className={result.ok ? "text-base text-primary" : "text-base text-destructive"}>
            {result.ok ? t.github.saved : t.github.error}: {result.detail}
          </p>
        )}

        <div className="mt-1 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              {t.github.close}
            </Button>
          </DialogClose>
          <Button
            variant="primary"
            size="sm"
            disabled={busy || !token || !owner || !repo}
            onClick={onSave}
          >
            <Icon name={busy ? "ph-circle-notch" : "ph-floppy-disk"} className={busy ? "animate-spin" : ""} />
            {busy ? t.github.saving : t.github.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
