import { useCallback, useMemo, useState } from "react";
import type { ManagedKey } from "../types.js";

type ValueMap = Partial<Record<ManagedKey, string>>;

export interface ConfigStore {
  /** Values as currently on disk (the baseline for dirty comparison). */
  original: ValueMap;
  /** Current effective value for a key (edit overrides original). */
  get(key: ManagedKey): string | undefined;
  /** Set a value. Setting back to the original clears the dirty flag. */
  set(key: ManagedKey, value: string): void;
  /** Revert a single key to its baseline value. */
  reset(key: ManagedKey): void;
  /** Revert all edits. */
  resetAll(): void;
  isDirty(key: ManagedKey): boolean;
  dirtyKeys: ManagedKey[];
  /** Effective values (baseline merged with edits). */
  values: ValueMap;
  /** Just the edited keys and their new values (what a write would apply). */
  edits: ValueMap;
  /** After a successful save: fold edits into the baseline and clear dirty. */
  commit(): void;
  /** Restore an exact prior state (used by undo). */
  restore(original: ValueMap, edits: ValueMap): void;
}

/**
 * In-memory config store. Holds the on-disk baseline plus an overlay of edits,
 * so dirty state is simply "does an edit differ from the baseline".
 */
export function useConfigStore(initial: ValueMap): ConfigStore {
  const [original, setOriginal] = useState<ValueMap>(initial);
  const [edits, setEdits] = useState<ValueMap>({});

  const get = useCallback(
    (key: ManagedKey): string | undefined => (key in edits ? edits[key] : original[key]),
    [edits, original],
  );

  const set = useCallback(
    (key: ManagedKey, value: string) => {
      setEdits((prev) => {
        const next = { ...prev };
        if (value === original[key] || (original[key] === undefined && value === "")) {
          delete next[key];
        } else {
          next[key] = value;
        }
        return next;
      });
    },
    [original],
  );

  const reset = useCallback((key: ManagedKey) => {
    setEdits((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const resetAll = useCallback(() => setEdits({}), []);

  const commit = useCallback(() => {
    setOriginal((o) => ({ ...o, ...edits }));
    setEdits({});
  }, [edits]);

  const restore = useCallback((o: ValueMap, e: ValueMap) => {
    setOriginal(o);
    setEdits(e);
  }, []);

  const isDirty = useCallback((key: ManagedKey): boolean => key in edits, [edits]);
  const dirtyKeys = useMemo(() => Object.keys(edits) as ManagedKey[], [edits]);
  const values = useMemo<ValueMap>(() => ({ ...original, ...edits }), [original, edits]);

  return { original, get, set, reset, resetAll, isDirty, dirtyKeys, values, edits, commit, restore };
}
