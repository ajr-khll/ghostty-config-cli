import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import type { ManagedKey } from "../types.js";
import type { ThemeColors } from "../state/themeColors.js";

// Fallback ANSI palette (xterm-ish) when a theme doesn't define one.
const DEFAULT_PALETTE = [
  "#000000", "#cc0000", "#4e9a06", "#c4a000", "#3465a4", "#75507b", "#06989a", "#d3d7cf",
  "#555753", "#ef2929", "#8ae234", "#fce94f", "#729fcf", "#ad7fa8", "#34e2e2", "#eeeeec",
];

interface Seg {
  text: string;
  color?: string;
}

/** A single terminal row: colored segments over the terminal background, padded to `width`. */
function Row({
  segments,
  width,
  bg,
  fg,
  cursor,
}: {
  segments: Seg[];
  width: number;
  bg: string;
  fg: string;
  cursor?: React.ReactNode;
}) {
  const used = segments.reduce((n, s) => n + s.text.length, 0) + (cursor ? 1 : 0);
  const pad = Math.max(0, width - used);
  return (
    <Text backgroundColor={bg} color={fg} wrap="truncate">
      {segments.map((s, i) => (
        <Text key={i} color={s.color ?? fg} backgroundColor={bg}>
          {s.text}
        </Text>
      ))}
      {cursor}
      {" ".repeat(pad)}
    </Text>
  );
}

export default function PreviewPane({
  values,
  theme,
  width,
}: {
  values: Partial<Record<ManagedKey, string>>;
  theme: ThemeColors | null;
  width: number;
}) {
  const bg = values.background || theme?.background || "#1e1e2e";
  const fg = values.foreground || theme?.foreground || "#cdd6f4";
  const pal = (i: number) => theme?.palette[i] || DEFAULT_PALETTE[i];
  const cursorColor = theme?.cursorColor || fg;
  const cursorStyle = values["cursor-style"] || "block";
  const blink = values["cursor-style-blink"] === "true";
  const fontFamily = values["font-family"] || "(default font)";
  const fontSize = values["font-size"] || "?";

  // Blink animation: toggle cursor visibility ~every 530ms when enabled.
  const [blinkOn, setBlinkOn] = useState(true);
  useEffect(() => {
    if (!blink) {
      setBlinkOn(true);
      return;
    }
    const id = setInterval(() => setBlinkOn((v) => !v), 530);
    return () => clearInterval(id);
  }, [blink]);

  const cursorVisible = !blink || blinkOn;
  let cursorNode: React.ReactNode;
  if (!cursorVisible) {
    cursorNode = <Text backgroundColor={bg}> </Text>;
  } else if (cursorStyle === "bar") {
    cursorNode = <Text color={cursorColor} backgroundColor={bg}>▏</Text>;
  } else if (cursorStyle === "underline") {
    cursorNode = <Text color={cursorColor} backgroundColor={bg}>▁</Text>;
  } else {
    cursorNode = <Text backgroundColor={cursorColor}> </Text>; // block
  }

  const w = Math.max(24, width);

  // Window chrome (title bar) — its own dark bg, independent of the terminal bg.
  const chromeBg = "#3a3a44";
  const chromeUsed = 8 + " ghostty — zsh".length;
  const chrome = (
    <Text backgroundColor={chromeBg} color="#dddddd" wrap="truncate">
      {"  "}
      <Text color="#ff5f56" backgroundColor={chromeBg}>●</Text>
      <Text backgroundColor={chromeBg}> </Text>
      <Text color="#ffbd2e" backgroundColor={chromeBg}>●</Text>
      <Text backgroundColor={chromeBg}> </Text>
      <Text color="#27c93f" backgroundColor={chromeBg}>●</Text>
      <Text backgroundColor={chromeBg}> ghostty — zsh</Text>
      {" ".repeat(Math.max(0, w - chromeUsed))}
    </Text>
  );

  return (
    <Box flexDirection="column">
      <Text dimColor>LIVE PREVIEW</Text>
      <Box flexDirection="column" marginTop={1}>
        {chrome}
        <Row
          segments={[
            { text: " ➜ ", color: pal(2) },
            { text: "~/.config/ghostty", color: pal(4) },
          ]}
          width={w}
          bg={bg}
          fg={fg}
        />
        <Row
          segments={[{ text: " ❯ " }, { text: "ghostty +list-themes" }]}
          width={w}
          bg={bg}
          fg={fg}
          cursor={cursorNode}
        />
        <Row
          segments={[
            { text: " TokyoNight  ", color: pal(4) },
            { text: "Catppuccin  ", color: pal(5) },
            { text: "Dracula", color: pal(3) },
          ]}
          width={w}
          bg={bg}
          fg={fg}
        />
        {/* ANSI palette strip */}
        <Text backgroundColor={bg} wrap="truncate">
          <Text backgroundColor={bg}>{" "}</Text>
          {Array.from({ length: 16 }, (_, i) => (
            <Text key={i} backgroundColor={pal(i)}>
              {" "}
            </Text>
          ))}
          <Text backgroundColor={bg}>{" ".repeat(Math.max(0, w - 17))}</Text>
        </Text>
      </Box>
      <Box marginTop={1} width={w}>
        <Text wrap="truncate">
          <Text dimColor>font </Text>
          {fontFamily}
          <Text dimColor>
            {" · "}
            {fontSize}pt · {values.background || values.foreground ? "explicit colors" : theme ? "theme colors" : "default colors"}
          </Text>
        </Text>
      </Box>
    </Box>
  );
}
