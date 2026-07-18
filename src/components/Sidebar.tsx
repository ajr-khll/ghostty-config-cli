import React from "react";
import { Box, Text } from "ink";
import type { FieldSpec, ManagedKey } from "../types.js";
import type { ConfigStore } from "../state/configStore.js";

export const SIDEBAR_WIDTH = 26;

export default function Sidebar({
  fields,
  selected,
  store,
}: {
  fields: FieldSpec[];
  selected: number;
  store: ConfigStore;
}) {
  return (
    <Box borderStyle="round" borderColor="gray" flexDirection="column" paddingX={1} width={SIDEBAR_WIDTH}>
      <Text bold dimColor>
        SETTINGS
      </Text>
      <Box marginTop={1} flexDirection="column">
        {fields.map((field, i) => {
          const isSel = i === selected;
          const dirty = store.isDirty(field.key as ManagedKey);
          return (
            <Box key={field.key}>
              <Text color={isSel ? "magenta" : "gray"}>{isSel ? "❯ " : "  "}</Text>
              <Text color={isSel ? "magenta" : "cyan"} bold={isSel} inverse={isSel}>
                {" "}
                {field.label.padEnd(SIDEBAR_WIDTH - 8)}
              </Text>
              <Text color="yellow">{dirty ? " •" : "  "}</Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
