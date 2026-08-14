/**
 * Export, without a report-generation endpoint.
 *
 * There is no backend route that produces a document, and the previous revision
 * handled that by shipping seven cards with permanently disabled Download
 * buttons and a `generateAnalyticsReport` stub that returned a canned sentence
 * behind a toast reading "Analytics report generated successfully".
 *
 * Both real formats here are produced from figures already on screen:
 *
 * - **Print / PDF** — the browser's own print pipeline against a print
 *   stylesheet. It is a real PDF, made of the real document.
 * - **CSV** — a serialisation of the same view models. Every cell is a value the
 *   backend reported; nothing is computed on the way out. A CSV that recomputed
 *   totals could disagree with the screen it was exported from.
 *
 * Neither invents a figure, and neither claims to be a server-generated report.
 */

export interface ReportRow {
  section: string;
  metric: string;
  /** Rendered value. Money is split into `value` + `currency` so a spreadsheet can sum it. */
  value: string;
  currency?: string;
  note?: string;
}

/** RFC 4180: quote everything containing a comma, quote or newline, and double inner quotes. */
function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function toCsv(rows: ReportRow[]): string {
  const header = ["Section", "Metric", "Value", "Currency", "Note"];
  const body = rows.map((row) =>
    [row.section, row.metric, row.value, row.currency ?? "", row.note ?? ""]
      .map((cell) => escapeCell(String(cell)))
      .join(","),
  );
  return [header.join(","), ...body].join("\r\n");
}

/**
 * Triggers a client-side download.
 *
 * The object URL is revoked on the next frame rather than immediately: Safari
 * cancels an in-flight download when the URL is revoked synchronously.
 */
export function downloadCsv(filename: string, csv: string): void {
  // A BOM makes Excel read UTF-8 correctly, which matters here because every
  // amount is prefixed with ₹ elsewhere in the product.
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

/** `Monthly summary` + `2026-08-14` → `pfos-monthly-summary-2026-08-14.csv`. */
export function reportFilename(title: string, extension = "csv"): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `pfos-${slug}-${new Date().toISOString().slice(0, 10)}.${extension}`;
}
