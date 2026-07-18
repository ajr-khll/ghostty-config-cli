import { readConfig, managedValues } from "./configFile.js";
import { listThemes, listFonts, GhosttyNotFoundError } from "./ghosttyIntrospect.js";
import type { ManagedKey, ParsedConfig } from "../types.js";

export interface ViewerState {
  path: string;
  existed: boolean;
  /** The full parsed config file — source of truth for surgical writes. */
  parsed: ParsedConfig;
  values: Partial<Record<ManagedKey, string>>;
  themeNames: string[];
  fontNames: string[];
  themeCount: number;
  fontCount: number;
  /** False if the `ghostty` binary isn't on PATH (theme/font lists unavailable). */
  ghosttyAvailable: boolean;
  themeValid?: boolean;
  fontValid?: boolean;
}

/**
 * Load the current config values plus live theme/font lists. Config editing
 * works even without the `ghostty` binary — in that case the theme/font lists
 * are simply empty and the UI flags them as unavailable.
 */
export async function loadViewerState(): Promise<ViewerState> {
  const parsed = await readConfig();
  const values = managedValues(parsed);

  let themeNames: string[] = [];
  let fontNames: string[] = [];
  let ghosttyAvailable = true;
  try {
    const [themes, fonts] = await Promise.all([listThemes(), listFonts()]);
    themeNames = themes.map((t) => t.name);
    fontNames = fonts;
  } catch (err) {
    if (err instanceof GhosttyNotFoundError) {
      ghosttyAvailable = false;
    } else {
      throw err;
    }
  }

  const themeSet = new Set(themeNames);
  const fontSet = new Set(fontNames);
  return {
    path: parsed.path,
    existed: parsed.existed,
    parsed,
    values,
    themeNames,
    fontNames,
    themeCount: themeNames.length,
    fontCount: fontNames.length,
    ghosttyAvailable,
    // Only validate when we actually have a list to check against.
    themeValid: ghosttyAvailable && values.theme ? themeSet.has(values.theme) : undefined,
    fontValid: ghosttyAvailable && values["font-family"] ? fontSet.has(values["font-family"]) : undefined,
  };
}
