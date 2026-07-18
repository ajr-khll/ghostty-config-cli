import { execa } from "execa";
import type { ThemeInfo } from "../types.js";

export class GhosttyNotFoundError extends Error {
  constructor() {
    super("`ghostty` was not found on your PATH. Install Ghostty or add it to PATH.");
    this.name = "GhosttyNotFoundError";
  }
}

async function runGhostty(args: string[]): Promise<string> {
  try {
    const { stdout } = await execa("ghostty", args, { timeout: 15_000 });
    return stdout;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new GhosttyNotFoundError();
    }
    throw err;
  }
}

/**
 * Parse `ghostty +list-themes`. On 1.3.x each line looks like:
 *   "TokyoNight (resources)"  or  "My Theme (user)"
 * We strip the trailing source marker but keep the name (spaces preserved).
 */
export function parseThemes(stdout: string): ThemeInfo[] {
  const out: ThemeInfo[] = [];
  for (const rawLine of stdout.split("\n")) {
    const line = rawLine.trim();
    if (line === "") continue;
    const m = /^(.*?)\s*\((resources|user)\)\s*$/.exec(line);
    if (m) {
      out.push({ name: m[1].trim(), source: m[2] as "resources" | "user" });
    } else {
      out.push({ name: line, source: "unknown" });
    }
  }
  return out;
}

/**
 * Parse `ghostty +list-fonts`. Output is hierarchical: column-0 lines are
 * family names; indented lines are style variants. We keep the families only,
 * trimmed and de-duplicated, preserving first-seen order.
 */
export function parseFonts(stdout: string): string[] {
  const seen = new Set<string>();
  const families: string[] = [];
  for (const rawLine of stdout.split("\n")) {
    if (rawLine.trim() === "") continue;
    // Indented => a style variant; skip.
    if (/^\s/.test(rawLine)) continue;
    const name = rawLine.trim();
    if (!seen.has(name)) {
      seen.add(name);
      families.push(name);
    }
  }
  return families;
}

export interface ConfigOptionDoc {
  key: string;
  defaultValue: string;
  docLines: string[];
}

/**
 * Parse `ghostty +show-config --default --docs` into per-key doc blocks.
 * Comment lines (`# ...`) accumulate as docs for the next `key = value` line.
 */
export function parseDefaultDocs(stdout: string): Map<string, ConfigOptionDoc> {
  const map = new Map<string, ConfigOptionDoc>();
  let docBuf: string[] = [];
  for (const rawLine of stdout.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.trimStart().startsWith("#")) {
      docBuf.push(line.trimStart().replace(/^#\s?/, ""));
      continue;
    }
    const m = /^([A-Za-z0-9_-]+)\s*=\s*(.*)$/.exec(line);
    if (m) {
      map.set(m[1], { key: m[1], defaultValue: m[2].trim(), docLines: docBuf });
      docBuf = [];
    } else if (line.trim() === "") {
      // blank line resets nothing; keep docs attaching to the next key
    }
  }
  return map;
}

// --- Public API (live shell-outs) -----------------------------------------

export async function listThemes(): Promise<ThemeInfo[]> {
  return parseThemes(await runGhostty(["+list-themes"]));
}

export async function listFonts(): Promise<string[]> {
  return parseFonts(await runGhostty(["+list-fonts"]));
}

export async function defaultDocs(): Promise<Map<string, ConfigOptionDoc>> {
  return parseDefaultDocs(await runGhostty(["+show-config", "--default", "--docs"]));
}

/** True if the `ghostty` binary is reachable. */
export async function ghosttyAvailable(): Promise<boolean> {
  try {
    await runGhostty(["+version"]);
    return true;
  } catch {
    return false;
  }
}
