// The subset of Ghostty config keys that ghostty-config-cli manages in v1.
// Every other line in the user's config is preserved untouched on write.
export const MANAGED_KEYS = [
  "background",
  "foreground",
  "theme",
  "font-family",
  "font-size",
  "background-opacity",
  "cursor-style",
  "cursor-style-blink",
] as const;

export type ManagedKey = (typeof MANAGED_KEYS)[number];

export type FieldKind = "color" | "enum" | "slider" | "text" | "bool";

export interface FieldSpec {
  key: ManagedKey;
  label: string;
  kind: FieldKind;
  /** For enum fields with a fixed option set (e.g. cursor-style). */
  options?: readonly string[];
  /** For slider fields. */
  min?: number;
  max?: number;
  step?: number;
  bigStep?: number;
  /** For text fields backed by a live-sourced list (font-family, theme). */
  source?: "themes" | "fonts";
  help?: string;
}

// The ordered v1 field list, matching the plan's scope.
export const FIELDS: FieldSpec[] = [
  { key: "theme", label: "Theme", kind: "text", source: "themes", help: "Named color theme (from `ghostty +list-themes`)." },
  { key: "font-family", label: "Font family", kind: "text", source: "fonts", help: "Installed font family (from `ghostty +list-fonts`)." },
  { key: "font-size", label: "Font size", kind: "slider", min: 4, max: 72, step: 1, bigStep: 4, help: "Point size." },
  { key: "background", label: "Background", kind: "color", help: "Hex color #RRGGBB or #RRGGBBAA." },
  { key: "foreground", label: "Foreground", kind: "color", help: "Hex color #RRGGBB or #RRGGBBAA." },
  { key: "background-opacity", label: "BG opacity", kind: "slider", min: 0, max: 1, step: 0.01, bigStep: 0.1, help: "0.0 (transparent) – 1.0 (opaque)." },
  { key: "cursor-style", label: "Cursor style", kind: "enum", options: ["block", "bar", "underline"], help: "Cursor shape." },
  { key: "cursor-style-blink", label: "Cursor blink", kind: "bool", help: "Whether the cursor blinks." },
];

// --- Parsed config file model ---------------------------------------------

/** A single physical line of the config file, tagged by kind. */
export type ConfigLine =
  | { kind: "blank"; raw: string }
  | { kind: "comment"; raw: string }
  | { kind: "kv"; raw: string; key: string; value: string; quoted: boolean }
  | { kind: "other"; raw: string }; // unparseable / unexpected — preserved verbatim

export interface ParsedConfig {
  /** Absolute path this was read from (or the target for a new file). */
  path: string;
  /** Whether the file existed on disk. */
  existed: boolean;
  /** Every physical line, in order. Source of truth for round-trip writes. */
  lines: ConfigLine[];
}

export interface ThemeInfo {
  name: string;
  source: "resources" | "user" | "unknown";
}
