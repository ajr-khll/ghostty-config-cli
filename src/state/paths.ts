import { homedir, platform } from "node:os";
import { join } from "node:path";
import { access } from "node:fs/promises";

/**
 * Cross-platform resolution of Ghostty's config and theme locations.
 *
 * Ghostty loads its config from (in order of what we support):
 *   - Linux:  $XDG_CONFIG_HOME/ghostty/{config,config.ghostty}
 *             (XDG_CONFIG_HOME defaults to ~/.config)
 *   - macOS:  ~/Library/Application Support/com.mitchellh.ghostty/{config,config.ghostty}
 *             and, if XDG_CONFIG_HOME is set, the XDG path too.
 *
 * Since 1.2.3 the `config.ghostty` extension is also loaded; we prefer it.
 *
 * The core functions accept `plat`/`env`/`home` overrides so both OS branches
 * are unit-testable; production calls use the live platform/env/home defaults.
 */

export interface OsContext {
  plat: NodeJS.Platform;
  env: NodeJS.ProcessEnv;
  home: string;
}

function ctx(partial?: Partial<OsContext>): OsContext {
  return {
    plat: partial?.plat ?? platform(),
    env: partial?.env ?? process.env,
    home: partial?.home ?? homedir(),
  };
}

function xdgConfigHome(c: OsContext): string {
  const xdg = c.env.XDG_CONFIG_HOME;
  return xdg && xdg.length > 0 ? xdg : join(c.home, ".config");
}

function macAppSupportDir(c: OsContext): string {
  return join(c.home, "Library", "Application Support", "com.mitchellh.ghostty");
}

/** The directory a brand-new config file should be created in for this OS. */
export function defaultConfigDir(partial?: Partial<OsContext>): string {
  const c = ctx(partial);
  // On macOS, honor an explicit XDG opt-in; otherwise use Application Support.
  if (c.plat === "darwin" && !c.env.XDG_CONFIG_HOME) return macAppSupportDir(c);
  return join(xdgConfigHome(c), "ghostty");
}

/** Ordered directories where an existing config file might live. */
export function configCandidateDirs(partial?: Partial<OsContext>): string[] {
  const c = ctx(partial);
  const dirs: string[] = [];
  if (c.plat === "darwin") {
    dirs.push(macAppSupportDir(c));
    dirs.push(join(xdgConfigHome(c), "ghostty"));
  } else {
    dirs.push(join(xdgConfigHome(c), "ghostty"));
  }
  return dedupe(dirs);
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the config file to read/write. Returns the first existing
 * `config.ghostty`/`config` across candidate dirs, else the OS-default
 * `config.ghostty` path for creation.
 */
export async function resolveConfigPath(partial?: Partial<OsContext>): Promise<string> {
  for (const dir of configCandidateDirs(partial)) {
    for (const name of ["config.ghostty", "config"]) {
      const p = join(dir, name);
      if (await exists(p)) return p;
    }
  }
  return join(defaultConfigDir(partial), "config.ghostty");
}

/**
 * Ordered directories that may contain Ghostty theme files, most-specific
 * (user overrides) first, then bundled system/app resources.
 */
export function themeCandidateDirs(partial?: Partial<OsContext>): string[] {
  const c = ctx(partial);
  const dirs: string[] = [];

  // User theme overrides.
  dirs.push(join(xdgConfigHome(c), "ghostty", "themes"));
  if (c.plat === "darwin") dirs.push(join(macAppSupportDir(c), "themes"));

  // Bundled themes.
  if (c.plat === "darwin") {
    dirs.push(
      "/Applications/Ghostty.app/Contents/Resources/ghostty/themes",
      join(c.home, "Applications/Ghostty.app/Contents/Resources/ghostty/themes"),
    );
  }
  dirs.push(
    "/usr/share/ghostty/themes",
    "/usr/local/share/ghostty/themes",
    "/opt/homebrew/share/ghostty/themes",
  );

  return dedupe(dirs);
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}
