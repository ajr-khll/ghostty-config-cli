import React, { useEffect, useState } from "react";
import { Box, Text, useApp, useInput, useStdin } from "ink";
import { GhosttyNotFoundError } from "./state/ghosttyIntrospect.js";
import { loadViewerState } from "./state/loadState.js";
import type { ViewerState } from "./state/loadState.js";
import { useConfigStore } from "./state/configStore.js";
import { useTerminalSize } from "./hooks/useTerminalSize.js";
import { loadThemeColors } from "./state/themeColors.js";
import type { ThemeColors } from "./state/themeColors.js";
import { saveConfig, restoreConfig } from "./state/saveConfig.js";
import { summarizeChanges } from "./state/diff.js";
import type { ParsedConfig, ManagedKey } from "./types.js";
import { FIELDS } from "./types.js";
import Header from "./components/Header.js";
import Sidebar, { SIDEBAR_WIDTH } from "./components/Sidebar.js";
import DetailPane from "./components/DetailPane.js";
import StatusBar from "./components/StatusBar.js";

type Load =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ViewerState };

export interface Toast {
  text: string;
  kind: "success" | "error" | "info";
}

interface UndoSnapshot {
  path: string;
  previousText: string;
  prevParsed: ParsedConfig;
  prevOriginal: Partial<Record<ManagedKey, string>>;
  prevEdits: Partial<Record<ManagedKey, string>>;
}

export default function App({ dryRun = false }: { dryRun?: boolean }) {
  const { columns, rows } = useTerminalSize();
  const [load, setLoad] = useState<Load>({ status: "loading" });

  useEffect(() => {
    (async () => {
      try {
        setLoad({ status: "ready", data: await loadViewerState() });
      } catch (err) {
        const message =
          err instanceof GhosttyNotFoundError ? err.message : err instanceof Error ? err.message : String(err);
        setLoad({ status: "error", message });
      }
    })();
  }, []);

  // Fill the entire terminal.
  return (
    <Box width={columns} height={rows} flexDirection="column">
      {load.status === "loading" && <Centered>Loading config and querying Ghostty…</Centered>}
      {load.status === "error" && (
        <Centered>
          <Text color="red" bold>
            Error:{" "}
          </Text>
          <Text color="red">{load.message}</Text>
        </Centered>
      )}
      {load.status === "ready" && <Editor data={load.data} dryRun={dryRun} />}
    </Box>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Box flexGrow={1} alignItems="center" justifyContent="center">
      <Text dimColor>{children}</Text>
    </Box>
  );
}

function Editor({ data, dryRun }: { data: ViewerState; dryRun: boolean }) {
  const { exit } = useApp();
  const { isRawModeSupported } = useStdin();
  const { columns, rows } = useTerminalSize();
  const store = useConfigStore(data.values);
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<"nav" | "edit">("nav");
  const [themeColors, setThemeColors] = useState<ThemeColors | null>(null);
  const [parsed, setParsed] = useState<ParsedConfig>(data.parsed);
  const [undo, setUndo] = useState<UndoSnapshot | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // Auto-dismiss the toast after a few seconds (undo stays available).
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  // A new edit after a save invalidates the one-level undo.
  const dirtyCount = store.dirtyKeys.length;
  useEffect(() => {
    if (dirtyCount > 0) setUndo((u) => (u ? null : u));
  }, [dirtyCount]);

  const onSave = async () => {
    if (dirtyCount === 0) {
      setToast({ text: "Nothing to save — already in sync.", kind: "info" });
      return;
    }
    if (dryRun) {
      setToast({
        text: `DRY RUN — would write: ${summarizeChanges(store.original, store.edits)} (not saved)`,
        kind: "info",
      });
      return;
    }
    const prevOriginal = { ...store.original };
    const prevEdits = { ...store.edits };
    const prevParsed = parsed;
    try {
      const result = await saveConfig(parsed, store.edits);
      setParsed(result.newParsed);
      store.commit();
      setUndo({ path: parsed.path, previousText: result.previousText, prevParsed, prevOriginal, prevEdits });
      setToast({
        text: `Saved ${result.changedCount} change${result.changedCount === 1 ? "" : "s"} ✓  ·  press u to undo  ·  reload Ghostty with ctrl+shift+r`,
        kind: "success",
      });
    } catch (err) {
      setToast({ text: `Save failed: ${err instanceof Error ? err.message : String(err)}`, kind: "error" });
    }
  };

  const onUndo = async () => {
    if (!undo) return;
    try {
      await restoreConfig(undo.path, undo.previousText);
      setParsed(undo.prevParsed);
      store.restore(undo.prevOriginal, undo.prevEdits);
      setUndo(null);
      setToast({ text: "Reverted last save. Reload Ghostty with ctrl+shift+r.", kind: "info" });
    } catch (err) {
      setToast({ text: `Undo failed: ${err instanceof Error ? err.message : String(err)}`, kind: "error" });
    }
  };

  // Resolve the selected theme's colors for the live preview.
  const currentTheme = store.get("theme");
  useEffect(() => {
    let cancelled = false;
    if (!currentTheme) {
      setThemeColors(null);
      return;
    }
    loadThemeColors(currentTheme).then((c) => {
      if (!cancelled) setThemeColors(c);
    });
    return () => {
      cancelled = true;
    };
  }, [currentTheme]);

  useInput(
    (input, key) => {
      if (input === "q" || (key.ctrl && input === "c")) {
        exit();
        return;
      }
      if (key.upArrow || input === "k") setSelected((s) => Math.max(0, s - 1));
      else if (key.downArrow || input === "j") setSelected((s) => Math.min(FIELDS.length - 1, s + 1));
      else if (key.return) setMode("edit");
      else if (input === "s" || (key.ctrl && input === "s")) void onSave();
      else if (input === "u") void onUndo();
      else if (input === "r") store.reset(FIELDS[selected].key);
      else if (input === "R") store.resetAll();
    },
    { isActive: isRawModeSupported && mode === "nav" },
  );

  const field = FIELDS[selected];
  const optionsFor = (source?: "themes" | "fonts"): string[] | undefined => {
    if (source === "themes") return data.themeNames;
    if (source === "fonts") return data.fontNames;
    return undefined;
  };

  // Live validation warning for the selected field (theme/font sourced lists).
  const fieldWarning = ((): string | undefined => {
    const value = store.get(field.key);
    if (field.source === "themes") {
      if (!data.ghosttyAvailable) return "ghostty not on PATH — theme list unavailable; value typed as-is.";
      if (value && !data.themeNames.includes(value)) return `"${value}" isn't in \`ghostty +list-themes\` — Ghostty will ignore it.`;
    }
    if (field.source === "fonts") {
      if (!data.ghosttyAvailable) return "ghostty not on PATH — font list unavailable; value typed as-is.";
      if (value && !data.fontNames.includes(value)) return `"${value}" isn't in \`ghostty +list-fonts\` — Ghostty may fall back to a default.`;
    }
    return undefined;
  })();

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Header path={data.path} dirtyCount={store.dirtyKeys.length} dryRun={dryRun} />
      <Box flexGrow={1} flexDirection="row">
        <Sidebar fields={FIELDS} selected={selected} store={store} />
        <DetailPane
          field={field}
          store={store}
          active={mode === "edit"}
          options={optionsFor(field.source)}
          warning={fieldWarning}
          themeColors={themeColors}
          previewEnabled={rows >= 22}
          previewWidth={Math.max(24, Math.min(64, columns - SIDEBAR_WIDTH - 12))}
          onChange={(v) => store.set(field.key, v)}
          onExit={() => setMode("nav")}
        />
      </Box>
      <StatusBar
        mode={mode}
        fieldLabel={field.label}
        noTTY={!isRawModeSupported}
        dirtyCount={dirtyCount}
        canUndo={undo !== null}
        toast={toast}
      />
    </Box>
  );
}
