import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type { FieldProps } from "./fieldProps.js";
import { validateColor } from "../state/validate.js";

/** A hex color for Ink's `backgroundColor` (6-digit; alpha stripped). */
function swatchColor(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const m = /^#([0-9a-fA-F]{6})/.exec(value.trim());
  return m ? `#${m[1]}` : undefined;
}

export default function ColorField(props: FieldProps) {
  const { value, active, onChange, onExit } = props;
  const [draft, setDraft] = useState(value ?? "");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (active) {
      setDraft(value ?? "");
      setError(undefined);
    }
  }, [active]);

  useInput(
    (_input, key) => {
      if (key.escape) onExit();
    },
    { isActive: active },
  );

  const submit = () => {
    const result = validateColor(draft);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onChange(result.normalized ?? draft.trim());
    onExit();
  };

  const swatch = swatchColor(active ? draft : value);

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginBottom={1}>
        {swatch ? (
          <>
            <Text backgroundColor={swatch}>{"          "}</Text>
            <Text backgroundColor={swatch}>{"          "}</Text>
          </>
        ) : (
          <>
            <Text dimColor>┌────────┐</Text>
            <Text dimColor>└ default ┘</Text>
          </>
        )}
      </Box>

      {active ? (
        <Box flexDirection="column">
          <Box>
            <Text color="green">▸ </Text>
            <TextInput value={draft} onChange={setDraft} onSubmit={submit} placeholder="#RRGGBB or #RRGGBBAA" />
          </Box>
          {error ? <Text color="red">✗ {error}</Text> : <Text dimColor>Enter to save · Esc to cancel</Text>}
        </Box>
      ) : (
        <Box>
          <Text bold>{value === undefined || value === "" ? "(default)" : value}</Text>
          <Text dimColor>   Enter to edit</Text>
        </Box>
      )}
    </Box>
  );
}
