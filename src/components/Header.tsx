import React from "react";
import { Box, Text } from "ink";
import { homedir } from "node:os";

function prettyPath(path: string): string {
  const home = homedir();
  return path.startsWith(home) ? "~" + path.slice(home.length) : path;
}

export default function Header({
  path,
  dirtyCount,
  dryRun,
}: {
  path: string;
  dirtyCount: number;
  dryRun: boolean;
}) {
  return (
    <Box paddingX={1}>
      <Text bold color="magenta">
        ▲ ghostty-config-cli
      </Text>
      <Text dimColor>  ·  created by aj khullar</Text>
      <Box flexGrow={1} />
      {dryRun && <Text color="black" backgroundColor="magenta">{" DRY RUN "}</Text>}
      <Box flexShrink={1} marginRight={2} marginLeft={dryRun ? 2 : 0}>
        <Text dimColor wrap="truncate-start">
          {prettyPath(path)}
        </Text>
      </Box>
      {dirtyCount > 0 ? (
        <Text color="black" backgroundColor="yellow">{` ● ${dirtyCount} unsaved `}</Text>
      ) : (
        <Text color="black" backgroundColor="green">{" ✓ in sync "}</Text>
      )}
    </Box>
  );
}
