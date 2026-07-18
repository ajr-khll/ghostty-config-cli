import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type { FieldProps } from "./fieldProps.js";

const WINDOW = 10;

/**
 * A type-to-filter picker over a live list (themes or fonts). While active it
 * shows a windowed, filtered list; ↑/↓ move the highlight, Enter selects,
 * Esc cancels. Typing narrows the list.
 */
export default function SearchSelectField(props: FieldProps) {
  const { value, active, onChange, onExit } = props;
  const options = props.options ?? [];
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (active) {
      setQuery("");
      const idx = value ? options.indexOf(value) : -1;
      setHighlight(idx >= 0 ? idx : 0);
    }
  }, [active]);

  useEffect(() => {
    if (highlight > filtered.length - 1) setHighlight(Math.max(0, filtered.length - 1));
  }, [filtered.length]);

  useInput(
    (_input, key) => {
      if (key.upArrow) setHighlight((h) => Math.max(0, h - 1));
      else if (key.downArrow) setHighlight((h) => Math.min(filtered.length - 1, h + 1));
      else if (key.return) {
        if (filtered[highlight] !== undefined) {
          onChange(filtered[highlight]);
          onExit();
        } else if (query.trim() !== "") {
          // No list match (custom value, or ghostty unavailable) — accept as typed.
          onChange(query.trim());
          onExit();
        }
      } else if (key.escape) onExit();
    },
    { isActive: active },
  );

  if (!active) {
    return (
      <Box flexDirection="column">
        <Text bold>{value === undefined || value === "" ? "(default)" : value}</Text>
        <Text dimColor>
          {options.length > 0 ? `Enter to browse ${options.length} options` : "Enter to type a value"}
        </Text>
      </Box>
    );
  }

  const start = Math.max(0, Math.min(highlight - Math.floor(WINDOW / 2), filtered.length - WINDOW));
  const windowStart = Math.max(0, start);
  const visible = filtered.slice(windowStart, windowStart + WINDOW);

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="green">🔍 </Text>
        <TextInput value={query} onChange={setQuery} placeholder="type to filter…" />
        <Text dimColor>  {filtered.length} match{filtered.length === 1 ? "" : "es"}</Text>
      </Box>
      <Box flexDirection="column">
        {visible.map((opt, i) => {
          const idx = windowStart + i;
          const isHi = idx === highlight;
          return (
            <Text key={opt} color={isHi ? "green" : undefined} inverse={isHi}>
              {isHi ? "❯ " : "  "}
              {opt}
              {opt === value ? "  ✓" : ""}
            </Text>
          );
        })}
        {filtered.length === 0 &&
          (query.trim() !== "" ? (
            <Text color="yellow">no match — Enter uses "{query.trim()}" as typed</Text>
          ) : (
            <Text dimColor>type a value…</Text>
          ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>↑/↓ move · Enter select/accept · Esc cancel</Text>
      </Box>
    </Box>
  );
}
