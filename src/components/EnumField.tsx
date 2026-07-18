import React from "react";
import { Box, Text, useInput } from "ink";
import type { FieldProps } from "./fieldProps.js";

export default function EnumField(props: FieldProps) {
  const { field, value, active, onChange, onExit } = props;
  const options = field.options ?? [];
  const currentIndex = Math.max(0, options.indexOf(value ?? ""));

  const cycle = (delta: number) => {
    if (options.length === 0) return;
    const next = (currentIndex + delta + options.length) % options.length;
    onChange(options[next]);
  };

  useInput(
    (_input, key) => {
      if (key.leftArrow || key.upArrow) cycle(-1);
      else if (key.rightArrow || key.downArrow) cycle(1);
      else if (key.return || key.escape) onExit();
    },
    { isActive: active },
  );

  return (
    <Box flexDirection="column">
      {options.map((opt, i) => {
        const isCurrent = i === currentIndex && value !== undefined;
        return (
          <Box key={opt}>
            <Text color={isCurrent ? "green" : "gray"}>{isCurrent ? "◉ " : "○ "}</Text>
            <Text color={isCurrent ? "green" : undefined} bold={isCurrent} inverse={active && isCurrent}>
              {opt}
            </Text>
          </Box>
        );
      })}
      <Box marginTop={1}>
        {active ? <Text dimColor>↑/↓ or ←/→ change · Enter done</Text> : <Text dimColor>Enter to change</Text>}
      </Box>
    </Box>
  );
}
