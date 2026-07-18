import React from "react";
import { Box, Text } from "ink";
import type { FieldSpec, ManagedKey } from "../types.js";
import type { ConfigStore } from "../state/configStore.js";
import type { ThemeColors } from "../state/themeColors.js";
import FieldEditor from "./FieldEditor.js";
import PreviewPane from "./PreviewPane.js";
import ThemeBrowser from "./ThemeBrowser.js";

export default function DetailPane({
  field,
  store,
  active,
  options,
  warning,
  themeColors,
  previewEnabled,
  previewWidth,
  onChange,
  onExit,
}: {
  field: FieldSpec;
  store: ConfigStore;
  active: boolean;
  options?: string[];
  warning?: string;
  themeColors: ThemeColors | null;
  previewEnabled: boolean;
  previewWidth: number;
  onChange: (value: string) => void;
  onExit: () => void;
}) {
  const key = field.key as ManagedKey;
  const dirty = store.isDirty(key);
  const original = store.original[key];
  // Theme editing opens a dedicated browser with its own live preview.
  const themeBrowsing = active && field.key === "theme";
  // The font browser needs the vertical space while open; the preview updates
  // the moment a selection is committed, so hide it during that browsing.
  const showPreview = previewEnabled && !(active && field.kind === "text");

  return (
    <Box borderStyle="round" borderColor={active ? "green" : "gray"} flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
      <Box>
        <Text bold color="cyan">
          {field.label}
        </Text>
        <Text dimColor>  ({field.key})</Text>
        {dirty && <Text color="yellow">   ● modified</Text>}
      </Box>
      <Box marginBottom={1}>
        <Text dimColor>{field.help}</Text>
      </Box>

      {themeBrowsing ? (
        <ThemeBrowser
          options={options ?? []}
          currentValue={store.get(key)}
          baseValues={store.values}
          previewWidth={Math.max(26, previewWidth - 32)}
          showPreview={previewEnabled}
          onCommit={(name) => {
            onChange(name);
            onExit();
          }}
          onCancel={onExit}
        />
      ) : (
        <>
          <FieldEditor
            field={field}
            value={store.get(key)}
            active={active}
            selected
            dirty={dirty}
            onChange={onChange}
            onExit={onExit}
            options={options}
          />

          {warning && (
            <Box marginTop={1}>
              <Text color="yellow">⚠ {warning}</Text>
            </Box>
          )}

          {dirty && (
            <Box marginTop={1}>
              <Text dimColor>on disk: </Text>
              <Text dimColor>{original === undefined || original === "" ? "(unset)" : original}</Text>
            </Box>
          )}

          <Box flexGrow={1} />

          {showPreview && <PreviewPane values={store.values} theme={themeColors} width={previewWidth} />}
        </>
      )}
    </Box>
  );
}
