import { type SavedView, SavedViewArraySchema } from "@/schemas";

/**
 * Görünüm kalıcılığı (Faz 0): kayıtlı görünümler + aktif görünüm durumu (filtre/sıra/kolon/grup)
 * browser-storage'da; oturumlar arası korunur (tek-mod, hep-düzenlenebilir).
 */
const VIEWS_KEY = "actionplan:savedViews:v1";
const STATE_KEY = "actionplan:viewState:v1";

function storage(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadSavedViews(): SavedView[] {
  const s = storage();
  if (!s) return [];
  try {
    const raw = s.getItem(VIEWS_KEY);
    if (!raw) return [];
    const parsed = SavedViewArraySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function saveSavedViews(views: SavedView[]): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(VIEWS_KEY, JSON.stringify(views));
    return true;
  } catch {
    return false;
  }
}

export interface ViewState {
  query: string;
  columns: string[];
  sort: { col: string; dir: "asc" | "desc" }[];
  group: string | null;
}

export function loadViewState(): Partial<ViewState> {
  const s = storage();
  if (!s) return {};
  try {
    const raw = s.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as Partial<ViewState>) : {};
  } catch {
    return {};
  }
}

export function saveViewState(patch: Partial<ViewState>): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(STATE_KEY, JSON.stringify({ ...loadViewState(), ...patch }));
  } catch {
    /* kota/erişim yok — yoksay */
  }
}
