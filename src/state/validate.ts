import type { FieldSpec } from "../types.js";

export interface ValidationResult {
  ok: boolean;
  message?: string;
  /** Optional normalized value (e.g. clamped number, lowercased hex). */
  normalized?: string;
}

const HEX_RE = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function validateColor(raw: string): ValidationResult {
  const value = raw.trim();
  if (value === "") return { ok: true, normalized: "" }; // empty = use default
  if (!HEX_RE.test(value)) {
    return { ok: false, message: "Expected hex #RRGGBB or #RRGGBBAA" };
  }
  return { ok: true, normalized: value.toLowerCase() };
}

export function validateNumber(raw: string, field: FieldSpec): ValidationResult {
  const value = raw.trim();
  if (value === "") return { ok: true, normalized: "" };
  const n = Number(value);
  if (!Number.isFinite(n)) return { ok: false, message: "Not a number" };
  if (field.min !== undefined && n < field.min) return { ok: false, message: `Must be ≥ ${field.min}` };
  if (field.max !== undefined && n > field.max) return { ok: false, message: `Must be ≤ ${field.max}` };
  return { ok: true, normalized: value };
}

/** Clamp a numeric value to a field's [min, max]. */
export function clamp(n: number, field: FieldSpec): number {
  let v = n;
  if (field.min !== undefined) v = Math.max(field.min, v);
  if (field.max !== undefined) v = Math.min(field.max, v);
  return v;
}

/** Format a slider number without floating-point noise (e.g. 0.30000001 -> "0.3"). */
export function formatNumber(n: number, step: number): string {
  const decimals = step < 1 ? Math.max(0, Math.ceil(-Math.log10(step))) : 0;
  return n.toFixed(decimals);
}
