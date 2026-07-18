import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { ConfigLine, ManagedKey, ParsedConfig } from "../types.js";
import { MANAGED_KEYS } from "../types.js";
import { resolveConfigPath } from "./paths.js";

export { resolveConfigPath } from "./paths.js";

// --- Parsing ---------------------------------------------------------------

const KV_RE = /^(\s*)([A-Za-z0-9_-]+)(\s*)=(\s*)(.*)$/;

function stripQuotes(value: string): { value: string; quoted: boolean } {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return { value: trimmed.slice(1, -1), quoted: true };
  }
  return { value: trimmed, quoted: false };
}

export function parseConfigText(text: string, path: string, existed: boolean): ParsedConfig {
  const rawLines = text.split("\n");
  // A trailing newline produces a final empty element; keep line count faithful
  // but drop the phantom last element so we don't add a blank line on write.
  if (rawLines.length > 0 && rawLines[rawLines.length - 1] === "" && text.endsWith("\n")) {
    rawLines.pop();
  }

  const lines: ConfigLine[] = rawLines.map((raw): ConfigLine => {
    if (raw.trim() === "") return { kind: "blank", raw };
    if (raw.trimStart().startsWith("#")) return { kind: "comment", raw };
    const m = KV_RE.exec(raw);
    if (m) {
      const key = m[2];
      const { value, quoted } = stripQuotes(m[5]);
      return { kind: "kv", raw, key, value, quoted };
    }
    return { kind: "other", raw };
  });

  return { path, existed, lines };
}

export async function readConfig(path?: string): Promise<ParsedConfig> {
  const target = path ?? (await resolveConfigPath());
  try {
    const text = await readFile(target, "utf8");
    return parseConfigText(text, target, true);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { path: target, existed: false, lines: [] };
    }
    throw err;
  }
}

// --- Reading managed values -----------------------------------------------

/**
 * Extract the managed keys as a flat map. For scalar keys, later occurrences in
 * file order win (Ghostty's override semantics). Missing keys are omitted.
 */
export function managedValues(parsed: ParsedConfig): Partial<Record<ManagedKey, string>> {
  const out: Partial<Record<ManagedKey, string>> = {};
  const managed = new Set<string>(MANAGED_KEYS);
  for (const line of parsed.lines) {
    if (line.kind === "kv" && managed.has(line.key)) {
      out[line.key as ManagedKey] = line.value;
    }
  }
  return out;
}

// --- Surgical write --------------------------------------------------------

function formatValue(value: string): string {
  // Quote values that contain spaces to be safe (Ghostty accepts quoted values).
  if (/\s/.test(value)) return `"${value}"`;
  return value;
}

function formatKv(key: string, value: string): string {
  return `${key} = ${formatValue(value)}`;
}

/**
 * Produce the new file text: rewrite only the managed keys the user changed,
 * in their existing positions; append newly-set managed keys at the end.
 * Every non-managed line is preserved verbatim and in order.
 *
 * `desired` holds the target value for each managed key the user is setting.
 * A key absent from `desired` is left exactly as-is on disk.
 */
export function renderConfig(parsed: ParsedConfig, desired: Partial<Record<ManagedKey, string>>): string {
  const managed = new Set<string>(MANAGED_KEYS);
  const seen = new Set<string>();
  const out: string[] = [];

  for (const line of parsed.lines) {
    if (line.kind === "kv" && managed.has(line.key) && line.key in desired) {
      const key = line.key as ManagedKey;
      if (!seen.has(key)) {
        // Rewrite the first occurrence in place with the new value.
        out.push(formatKv(key, desired[key]!));
        seen.add(key);
      }
      // Drop any later duplicate occurrences of this managed key (we've
      // canonicalized it to a single line). Non-managed dups are untouched.
      continue;
    }
    out.push(line.raw);
  }

  // Append managed keys that were set but had no existing line.
  const appended: string[] = [];
  for (const key of MANAGED_KEYS) {
    if (key in desired && !seen.has(key)) {
      appended.push(formatKv(key, desired[key]!));
    }
  }
  if (appended.length > 0) {
    if (out.length > 0 && out[out.length - 1].trim() !== "") out.push("");
    out.push(...appended);
  }

  return out.join("\n") + "\n";
}

/** Atomically write text to `path` (temp file + rename on same filesystem). */
export async function atomicWrite(path: string, text: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.ghostty-config-cli.tmp`;
  await writeFile(tmp, text, "utf8");
  await rename(tmp, path);
}
