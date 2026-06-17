import { Button, Icon } from "@/components/ui/primitives";
import { downloadFile, exportCSV, exportJSON, importCSV, importJSON } from "@/engine";
import { t } from "@/lib/strings";
import { taskStore, useTaskStore } from "@/store/taskStore";
import { useRef, useState } from "react";

export function ExportImportBar() {
  const nodes = useTaskStore((s) => s.nodes);
  const dirty = useTaskStore((s) => s.dirty);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string>("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = file.name.endsWith(".csv") ? importCSV(text) : importJSON(text);
    if (result.errors.length) {
      setMsg(`İçe aktarma hataları: ${result.errors.length} (ilki: ${result.errors[0]})`);
    } else {
      taskStore.applyImport(result.nodes, "merge");
      setMsg(`${result.nodes.length} görev içe aktarıldı (birleştirildi).`);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Dışa/İçe aktarma">
      <Button
        size="sm"
        onClick={() => downloadFile("eylem-plani.json", exportJSON(nodes), "application/json")}
      >
        <Icon name="ph-file-arrow-down" /> {t.actions.exportJSON}
      </Button>
      <Button
        size="sm"
        onClick={() => downloadFile("eylem-plani.csv", exportCSV(nodes), "text/csv")}
      >
        <Icon name="ph-file-csv" /> {t.actions.exportCSV}
      </Button>
      <Button size="sm" onClick={() => fileRef.current?.click()}>
        <Icon name="ph-file-arrow-up" /> {t.actions.importFile}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,.csv"
        className="hidden"
        onChange={onFile}
        aria-hidden="true"
      />
      {dirty && (
        <span className="text-base text-muted-foreground">
          <Icon name="ph-circle-dashed" /> oturum-içi değişiklik var
        </span>
      )}
      {msg && (
        <span className="text-base text-primary" role="status">
          {msg}
        </span>
      )}
    </div>
  );
}
