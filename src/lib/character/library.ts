import { CharacterSheet } from "./types";

export interface SavedCharacter {
  id: string;
  savedAt: number;
  name: string;
  thumbnail: string;
  sheet: CharacterSheet;
}

const STORAGE_KEY = "characterLibrary";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadLibrary(): SavedCharacter[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedCharacter[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLibrary(list: SavedCharacter[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function saveCharacter(
  sheet: CharacterSheet,
  thumbnail: string,
  name?: string,
): SavedCharacter {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const entry: SavedCharacter = {
    id,
    savedAt: Date.now(),
    name: name?.trim() || sheet.anchor_tag,
    thumbnail,
    sheet,
  };
  const list = loadLibrary();
  list.unshift(entry);
  writeLibrary(list);
  return entry;
}

export function deleteCharacter(id: string) {
  const list = loadLibrary().filter((c) => c.id !== id);
  writeLibrary(list);
}

export function renameCharacter(id: string, name: string) {
  const list = loadLibrary().map((c) =>
    c.id === id ? { ...c, name: name.trim() || c.name } : c,
  );
  writeLibrary(list);
}

export function getCharacter(id: string): SavedCharacter | undefined {
  return loadLibrary().find((c) => c.id === id);
}
