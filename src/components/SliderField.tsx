import React, { useEffect, useRef } from "react";
import { Box, Text, useInput } from "ink";
import type { FieldProps } from "./fieldProps.js";
import { clamp, formatNumber } from "../state/validate.js";

const BAR_WIDTH = 30;

export default function SliderField(props: FieldProps) {
  const { field, value, active, onChange, onExit } = props;
  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const step = field.step ?? 1;
  const bigStep = field.bigStep ?? step * 10;

  const current = value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : min;

  // Mirror current in a ref so rapid key-repeat presses accumulate correctly
  // even before React re-renders with the new prop value.
  const currentRef = useRef(current);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const adjust = (delta: number) => {
    const next = clamp(Math.round((currentRef.current + delta) / step) * step, field);
    currentRef.current = next;
    onChange(formatNumber(next, step));
  };

  useInput(
    (_input, key) => {
      if (key.leftArrow) adjust(-step);
      else if (key.rightArrow) adjust(step);
      else if (key.downArrow) adjust(-bigStep);
      else if (key.upArrow) adjust(bigStep);
      else if (key.return || key.escape) onExit();
    },
    { isActive: active },
  );

  const ratio = max > min ? (current - min) / (max - min) : 0;
  const filled = Math.round(ratio * BAR_WIDTH);
  const bar = "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
  const display = value === undefined || value === "" ? "(default)" : formatNumber(current, step);

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={active ? "green" : "cyan"}>{bar}</Text>
        <Text bold>  {display}</Text>
      </Box>
      <Box>
        <Text dimColor>{formatNumber(min, step)}</Text>
        <Box flexGrow={1} />
        <Text dimColor>{formatNumber(max, step)}</Text>
      </Box>
      {active ? (
        <Text dimColor>←/→ ±{step} · ↑/↓ ±{bigStep} · Enter done</Text>
      ) : (
        <Text dimColor>Enter to adjust</Text>
      )}
    </Box>
  );
}
