import React from "react";
import { Box, Text } from "ink";
import type { Toast } from "../App.js";

function Key({ children }: { children: string }) {
  return <Text color="black" backgroundColor="cyan">{` ${children} `}</Text>;
}

const TOAST_COLOR: Record<Toast["kind"], string> = {
  success: "green",
  error: "red",
  info: "yellow",
};

export default function StatusBar({
  mode,
  fieldLabel,
  noTTY,
  dirtyCount,
  canUndo,
  toast,
}: {
  mode: "nav" | "edit";
  fieldLabel: string;
  noTTY: boolean;
  dirtyCount: number;
  canUndo: boolean;
  toast: Toast | null;
}) {
  // A toast takes over the bar while visible (keeps the bar a single line).
  if (toast) {
    return (
      <Box paddingX={1}>
        <Text color={TOAST_COLOR[toast.kind]} bold>
          {toast.kind === "error" ? "✗ " : toast.kind === "success" ? "✓ " : "• "}
          {toast.text}
        </Text>
      </Box>
    );
  }

  return (
    <Box paddingX={1}>
      {noTTY ? (
        <Text color="yellow">No TTY detected — run in a real terminal for interactive editing.</Text>
      ) : mode === "nav" ? (
        <Box>
          <Key>↑/↓</Key>
          <Text dimColor> nav  </Text>
          <Key>enter</Key>
          <Text dimColor> edit  </Text>
          {dirtyCount > 0 && (
            <>
              <Key>s</Key>
              <Text dimColor> save  </Text>
            </>
          )}
          {canUndo && (
            <>
              <Key>u</Key>
              <Text dimColor> undo  </Text>
            </>
          )}
          <Key>r</Key>
          <Text dimColor> reset  </Text>
          <Key>R</Key>
          <Text dimColor> reset all  </Text>
          <Key>q</Key>
          <Text dimColor> quit</Text>
        </Box>
      ) : (
        <Box>
          <Text color="green">editing {fieldLabel}  </Text>
          <Key>esc</Key>
          <Text dimColor> cancel / finish</Text>
        </Box>
      )}
    </Box>
  );
}
