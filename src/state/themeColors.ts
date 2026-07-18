import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { parseConfigText } from "./configFile.js";
import { themeCandidateDirs } from "./paths.js";

export interface ThemeColors {
  background?: string;
  foreground?: string;
  cursorColor?: string;
  /** Indices 0–15 of the ANSI palette (may contain holes). */
  palette: (string | undefined)[];
}

const cache = new Map<string, ThemeColors | null>();

function normalizeHex(v: string): string | undefined {
  const t = v.trim().replace(/^["']|["']$/g, "");
  if (t === "") return undefined;
  return t.startsWith("#") ? t : `#${t}`;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve a theme's colors by reading its file (a plain Ghostty config).
 * Returns null if the theme file can't be found. Results are cached.
 */
export async function loadThemeColors(name: string): Promise<ThemeColors | null> {
  const key = name.trim();
  if (key === "") return null;
  if (cache.has(key)) return cache.get(key)!;

  let result: ThemeColors | null = null;
  for (const dir of themeCandidateDirs()) {
    const file = join(dir, key);
    if (!(await exists(file))) continue;
    const text = await readFile(file, "utf8");
    const parsed = parseConfigText(text, file, true);
    const palette: (string | undefined)[] = new Array(16).fill(undefined);
    let background: string | undefined;
    let foreground: string | undefined;
    let cursorColor: string | undefined;
    for (const line of parsed.lines) {
      if (line.kind !== "kv") continue;
      if (line.key === "background") background = normalizeHex(line.value);
      else if (line.key === "foreground") foreground = normalizeHex(line.value);
      else if (line.key === "cursor-color") cursorColor = normalizeHex(line.value);
      else if (line.key === "palette") {
        const m = /^(\d+)\s*=\s*(#?[0-9a-fA-F]{6,8})$/.exec(line.value.trim());
        if (m) {
          const i = Number(m[1]);
          if (i >= 0 && i < 16) palette[i] = normalizeHex(m[2]);
        }
      }
    }
    result = { background, foreground, cursorColor, palette };
    break;
  }

  cache.set(key, result);
  return result;
}
