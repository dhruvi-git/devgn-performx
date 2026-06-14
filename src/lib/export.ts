// Lightweight client-side export helpers
export function toCSV<T extends Record<string, unknown>>(rows: T[], columns?: (keyof T)[]): string {
  if (!rows.length) return "";
  const cols = (columns ?? (Object.keys(rows[0]) as (keyof T)[])) as string[];
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => escape((r as Record<string, unknown>)[c])).join(","))].join("\n");
}

export function downloadFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV<T extends Record<string, unknown>>(filename: string, rows: T[], columns?: (keyof T)[]) {
  downloadFile(filename, toCSV(rows, columns), "text/csv;charset=utf-8");
}
