import type { FieldSpec } from "../types.js";

export interface FieldProps {
  field: FieldSpec;
  /** Current effective value (may be undefined = unset/default). */
  value: string | undefined;
  /** Whether this field is currently in edit mode (captures input). */
  active: boolean;
  /** Whether this field is the nav cursor selection (for highlighting). */
  selected: boolean;
  /** Whether this field has unsaved edits. */
  dirty: boolean;
  /** Commit a new value to the store. */
  onChange: (value: string) => void;
  /** Leave edit mode, returning focus to the nav list. */
  onExit: () => void;
  /** For source-backed fields: the live option list (themes or fonts). */
  options?: string[];
}
