#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import App from "./App.js";
import { loadViewerState } from "./state/loadState.js";
import { GhosttyNotFoundError } from "./state/ghosttyIntrospect.js";
import { FIELDS } from "./types.js";
import { NAME, VERSION, DESCRIPTION, AUTHOR, HOMEPAGE } from "./meta.js";

const args = process.argv.slice(2);
const has = (...names: string[]) => names.some((n) => args.includes(n));

if (has("--version", "-v")) {
  console.log(`${NAME} v${VERSION}`);
  process.exit(0);
}

if (has("--help", "-h")) {
  console.log(`${NAME} v${VERSION} — ${DESCRIPTION}
created by ${AUTHOR}${HOMEPAGE ? `\n${HOMEPAGE}` : ""}

Usage:
  ghostty-config-cli            Launch the interactive fullscreen editor
  ghostty-config-cli --print    Print current managed values and exit (no TTY needed)
  ghostty-config-cli --dry-run  Launch the editor but preview saves without writing
  ghostty-config-cli --version  Print version
  ghostty-config-cli --help     Show this help

In the editor:  ↑/↓ navigate · Enter edit · s save · u undo · r/R reset · q quit
Reload Ghostty after saving with ctrl+shift+r (its built-in config reload).
`);
  process.exit(0);
}

if (has("--print")) {
  try {
    const data = await loadViewerState();
    console.log(`${NAME} v${VERSION} — created by ${AUTHOR}`);
    console.log(`Config: ${data.path}${data.existed ? "" : " (does not exist yet)"}`);
    if (!data.ghosttyAvailable) console.log("Note: `ghostty` not on PATH — theme/font validation skipped.");
    for (const field of FIELDS) {
      const value = data.values[field.key];
      let note = "";
      if (field.key === "theme" && value && data.themeValid === false) note = "  ⚠ not in +list-themes";
      if (field.key === "font-family" && value && data.fontValid === false) note = "  ⚠ not installed";
      console.log(`  ${field.label.padEnd(14)} ${value ?? "(default / unset)"}${note}`);
    }
    if (data.ghosttyAvailable) {
      console.log(`\n${data.themeCount} themes · ${data.fontCount} font families available`);
    }
    process.exit(0);
  } catch (err) {
    const msg = err instanceof GhosttyNotFoundError ? err.message : err instanceof Error ? err.message : String(err);
    console.error(`Error: ${msg}`);
    process.exit(1);
  }
}

const dryRun = has("--dry-run");

// --- Fullscreen (alternate screen buffer) ---------------------------------
const isTTY = Boolean(process.stdout.isTTY);
const ENTER_ALT = "\x1b[?1049h";
const LEAVE_ALT = "\x1b[?1049l";
const CLEAR_HOME = "\x1b[2J\x1b[H";

function leaveAlt() {
  if (isTTY) process.stdout.write(LEAVE_ALT);
}

if (!isTTY) {
  console.error(
    "ghostty-config-cli needs an interactive terminal. Try `ghostty-config-cli --print` for a non-interactive summary.",
  );
  process.exit(1);
}

process.stdout.write(ENTER_ALT + CLEAR_HOME);
process.on("exit", leaveAlt);
process.on("SIGINT", () => {
  leaveAlt();
  process.exit(0);
});
process.on("SIGTERM", () => {
  leaveAlt();
  process.exit(0);
});

const { waitUntilExit } = render(<App dryRun={dryRun} />);
await waitUntilExit();
leaveAlt();
process.exit(0);
