import { useEffect, useState } from "react";
import { useStdout } from "ink";

export interface TerminalSize {
  columns: number;
  rows: number;
}

const DEFAULT: TerminalSize = { columns: 80, rows: 24 };

/**
 * Track the live terminal dimensions, updating on SIGWINCH/resize.
 * Falls back to a sane default when no real TTY is attached (e.g. in tests).
 */
export function useTerminalSize(): TerminalSize {
  const { stdout } = useStdout();
  const [size, setSize] = useState<TerminalSize>(() => ({
    columns: stdout?.columns ?? DEFAULT.columns,
    rows: stdout?.rows ?? DEFAULT.rows,
  }));

  useEffect(() => {
    if (!stdout || typeof stdout.on !== "function") return;
    const onResize = () => {
      setSize({
        columns: stdout.columns ?? DEFAULT.columns,
        rows: stdout.rows ?? DEFAULT.rows,
      });
    };
    onResize();
    stdout.on("resize", onResize);
    return () => {
      stdout.off("resize", onResize);
    };
  }, [stdout]);

  return size;
}
