import type { ManagedKey } from "../types.js";

type ValueMap = Partial<Record<ManagedKey, string>>;

export interface Change {
  key: ManagedKey;
  before: string | undefined;
  after: string;
  kind: "add" | "modify";
}

/** Describe the pending managed-key changes between the baseline and edits. */
export function describeChanges(original: ValueMap, edits: ValueMap): Change[] {
  const changes: Change[] = [];
  for (const k of Object.keys(edits) as ManagedKey[]) {
    const before = original[k];
    changes.push({ key: k, before, after: edits[k]!, kind: before === undefined ? "add" : "modify" });
  }
  return changes;
}

/** A compact one-line summary, e.g. `font-size 11→14, background +#101010`. */
export function summarizeChanges(original: ValueMap, edits: ValueMap): string {
  return describeChanges(original, edits)
    .map((c) => (c.kind === "add" ? `${c.key} +${c.after}` : `${c.key} ${c.before}→${c.after}`))
    .join(", ");
}
