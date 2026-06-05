/**
 * Downloads data as a UTF-8 CSV file (BOM-encoded for correct Excel opening).
 */
export function downloadCSV(rows: Record<string, string | number | null | undefined>[], filename: string): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);

  function escapeCell(val: string | number | null | undefined): string {
    const s = String(val ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  }

  const csvLines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(",")),
  ];

  // BOM (﻿) ensures Excel opens with correct encoding
  const blob = new Blob(["﻿" + csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Formats a date to YYYY-MM-DD for filenames.
 */
export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
