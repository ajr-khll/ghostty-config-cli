import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import PreviewPane from "./PreviewPane.js";
import { loadThemeColors } from "../state/themeColors.js";
import type { ThemeColors } from "../state/themeColors.js";
import type { ManagedKey } from "../types.js";

const WINDOW = 12;

/**
 * A dedicated theme picker that live-previews each theme's real colors as the
 * highlight moves — so you can see a theme before committing to it.
 * Enter applies the highlighted theme; Esc cancels without changing anything.
 */
export default function ThemeBrowser({
  options,
  currentValue,
  baseValues,
  previewWidth,
  showPreview,
  onCommit,
  onCancel,
}: {
  options: string[];
  currentValue: string | undefined;
  baseValues: Partial<Record<ManagedKey, string>>;
  previewWidth: number;
  showPreview: boolean;
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [colors, setColors] = useState<ThemeColors | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q === "" ? options : options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  // Preselect the current theme on open.
  useEffect(() => {
    const idx = currentValue ? options.indexOf(currentValue) : -1;
    setHighlight(idx >= 0 ? idx : 0);
  }, []);

  useEffect(() => {
    if (highlight > filtered.length - 1) setHighlight(Math.max(0, filtered.length - 1));
  }, [filtered.length]);

  const highlighted = filtered[highlight];

  // Load the highlighted theme's colors for the preview (cached in the module).
  useEffect(() => {
    let cancelled = false;
    if (!highlighted) {
      setColors(null);
      return;
    }
    loadThemeColors(highlighted).then((c) => {
      if (!cancelled) setColors(c);
    });
    return () => {
      cancelled = true;
    };
  }, [highlighted]);

  useInput((_input, key) => {
    if (key.upArrow) setHighlight((h) => Math.max(0, h - 1));
    else if (key.downArrow) setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    else if (key.return) {
      if (highlighted) onCommit(highlighted);
    } else if (key.escape) onCancel();
  });

  const start = Math.max(0, Math.min(highlight - Math.floor(WINDOW / 2), filtered.length - WINDOW));
  const windowStart = Math.max(0, start);
  const visible = filtered.slice(windowStart, windowStart + WINDOW);

  // Show the theme's own colors (ignore any explicit bg/fg override so the
  // theme is faithfully represented), keeping font/cursor from the config.
  const previewValues: Partial<Record<ManagedKey, string>> = {
    "font-family": baseValues["font-family"],
    "font-size": baseValues["font-size"],
    "cursor-style": baseValues["cursor-style"],
    "cursor-style-blink": baseValues["cursor-style-blink"],
  };

  const list = (
    <Box flexDirection="column" width={showPreview ? 30 : undefined} flexShrink={0}>
      <Box marginBottom={1}>
        <Text color="green">🔍 </Text>
        <TextInput value={query} onChange={setQuery} placeholder="filter themes…" />
      </Box>
      <Box flexDirection="column">
        {visible.map((opt, i) => {
          const idx = windowStart + i;
          const isHi = idx === highlight;
          return (
            <Text key={opt} color={isHi ? "green" : undefined} inverse={isHi} wrap="truncate">
              {isHi ? "❯ " : "  "}
              {opt}
              {opt === currentValue ? " ✓" : ""}
            </Text>
          );
        })}
        {filtered.length === 0 && <Text color="red">no themes match</Text>}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {filtered.length} theme{filtered.length === 1 ? "" : "s"} · ↑/↓ browse · Enter apply · Esc cancel
        </Text>
      </Box>
    </Box>
  );

  if (!showPreview) return list;

  return (
    <Box flexDirection="row" flexGrow={1}>
      {list}
      <Box marginLeft={2} flexDirection="column">
        <PreviewPane values={previewValues} theme={colors} width={previewWidth} />
      </Box>
    </Box>
  );
}
