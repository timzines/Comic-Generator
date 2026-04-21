import type { SceneInput } from "./schema";

export interface SavedScene {
  id: string;
  savedAt: number;
  name: string;
  input: SceneInput;
  prompt: string;
}

const STORAGE_KEY = "sceneLibrary";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadScenes(): SavedScene[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedScene[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeScenes(list: SavedScene[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function saveScene(
  name: string,
  input: SceneInput,
  prompt: string,
): SavedScene {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const entry: SavedScene = {
    id,
    savedAt: Date.now(),
    name: name.trim() || `Scene ${new Date().toLocaleString()}`,
    input,
    prompt,
  };
  const list = loadScenes();
  list.unshift(entry);
  writeScenes(list);
  return entry;
}

export function deleteScene(id: string) {
  writeScenes(loadScenes().filter((s) => s.id !== id));
}
