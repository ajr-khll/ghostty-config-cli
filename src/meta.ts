import { createRequire } from "node:module";

// Read package.json at runtime (works from both src/ via tsx and dist/ when built).
const require = createRequire(import.meta.url);
const pkg = require("../package.json") as {
  name: string;
  version: string;
  description: string;
  homepage?: string;
};

export const NAME = pkg.name;
export const VERSION = pkg.version;
export const DESCRIPTION = pkg.description;
export const HOMEPAGE = pkg.homepage ?? "";
export const AUTHOR = "aj khullar";
