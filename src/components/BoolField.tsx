import React from "react";
import { Box, Text, useInput } from "ink";
import type { FieldProps } from "./fieldProps.js";

export default function BoolField(props: FieldProps) {
  const { value, active, onChange, onExit } = props;
  const on = value === "true";

  useInput(
    (input, key) => {
      if (key.leftArrow || key.rightArrow || key.upArrow || key.downArrow || input === " ")
        onChange(on ? "false" : "true");
      else if (key.return || key.escape) onExit();
    },
    { isActive: active },
  );

  return (
    <Box flexDirection="column">
      <Box>
        <Text inverse={active && !on} color={!on ? "red" : "gray"} bold={!on}>
          {"  OFF  "}
        </Text>
        <Text> </Text>
        <Text inverse={active && on} color={on ? "green" : "gray"} bold={on}>
          {"  ON  "}
        </Text>
      </Box>
      <Box marginTop={1}>
        {active ? <Text dimColor>Space/←/→ toggle · Enter done</Text> : <Text dimColor>Enter to toggle</Text>}
      </Box>
    </Box>
  );
}
