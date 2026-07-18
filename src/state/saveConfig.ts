import type { ManagedKey, ParsedConfig } from "../types.js";
import { renderConfig, atomicWrite, parseConfigText } from "./configFile.js";

export interface SaveResult {
  /** Reflects the file as it now exists on disk (basis for the next save). */
  newParsed: ParsedConfig;
  /** The exact file text present before this save (basis for undo). */
  previousText: string;
  /** Number of managed keys written. */
  changedCount: number;
}

/** Serialize a parsed config back to its exact on-disk text. */
export function toText(parsed: ParsedConfig): string {
  if (parsed.lines.length === 0) return "";
  return parsed.lines.map((l) => l.raw).join("\n") + "\n";
}

/**
 * Surgically write the given edits into the config (preserving every line the
 * tool doesn't manage), atomically. Returns the pre-save text for undo.
 */
export async function saveConfig(
  parsed: ParsedConfig,
  edits: Partial<Record<ManagedKey, string>>,
): Promise<SaveResult> {
  const previousText = toText(parsed);
  const newText = renderConfig(parsed, edits);
  await atomicWrite(parsed.path, newText);
  return {
    newParsed: parseConfigText(newText, parsed.path, true),
    previousText,
    changedCount: Object.keys(edits).length,
  };
}

/** Restore a previous file text to disk (undo), returning its parsed form. */
export async function restoreConfig(path: string, previousText: string): Promise<ParsedConfig> {
  await atomicWrite(path, previousText);
  return parseConfigText(previousText, path, true);
}
