## Install

```sh
npm install -g ghostty-config-cli
```

# ghostty-config-cli

**A fullscreen terminal UI for editing  [Ghostty](https://ghostty.org) config  + live preview**

![demo](https://raw.githubusercontent.com/ajr-khll/ghostty-config-cli/main/demo.gif)

---

- **Fullscreen, paned TUI** — sidebar navigation, a focused detail editor, and a live preview, rendered in the alternate screen buffer (your scrollback is restored on exit).
- **Live preview** — a mock terminal window that updates as you type: real theme colors (resolved straight from Ghostty's theme files), the 16-color ANSI palette, and a cursor that reflects your `cursor-style` and blink settings.
- **Safe, surgical writes** — only the settings this tool manages are rewritten. Your comments, keybindings, and every other line are preserved **byte-for-byte**. Writes are atomic (temp file + rename), so a config is never left half-written.
- **Save with one-level undo** — `s` writes immediately; `u` restores the exact previous file.
- **Smart pickers** — type-to-filter over `ghostty +list-themes` (463 themes) and `ghostty +list-fonts`, with warnings for unknown themes or uninstalled fonts. Custom values are accepted too.
- **Degrades gracefully** — works even if `ghostty` isn't on your `PATH`; you can still edit colors, size, and cursor.

## Settings managed (v1)

`theme` · `font-family` · `font-size` · `background` · `foreground` · `background-opacity` · `cursor-style` · `cursor-style-blink`

Every other key in your config is left untouched.

Requires Node.js ≥ 18. Ghostty is recommended (for theme/font enumeration) but not required.

## Usage

```sh
ghostty-config-cli            # launch the interactive editor
ghostty-config-cli --print    # print current values and exit (no TTY needed)
ghostty-config-cli --dry-run  # edit, but preview saves without writing
ghostty-config-cli --version
ghostty-config-cli --help
```

### Keys

| Key | Action |
| --- | --- |
| `↑` / `↓` (or `k` / `j`) | Navigate settings |
| `Enter` | Edit the selected setting |
| `←` / `→`, `↑` / `↓` | Adjust sliders / cycle options |
| `Esc` | Finish / cancel editing |
| `s` | Save to disk |
| `u` | Undo the last save |
| `r` / `R` | Reset field / reset all |
| `q` | Quit |

After saving, reload Ghostty with `ctrl+shift+r` (its built-in config reload) to see changes live.

## Config location

Resolved automatically per OS:

- **Linux:** `$XDG_CONFIG_HOME/ghostty/config.ghostty` (or `~/.config/ghostty/…`)
- **macOS:** `~/Library/Application Support/com.mitchellh.ghostty/config.ghostty` (honors `XDG_CONFIG_HOME` if set)

`config.ghostty` is preferred (loaded by Ghostty ≥ 1.2.3 and gives editor syntax highlighting); a plain `config` file is used if that's what exists.

## Development

```sh
npm install
npm run dev        # run from source with tsx
npm run typecheck
npm run build      # compile to dist/
```

Built with TypeScript, [Ink](https://github.com/vadimdemedes/ink), and [execa](https://github.com/sindresorhus/execa).

## License

MIT © aj khullar
