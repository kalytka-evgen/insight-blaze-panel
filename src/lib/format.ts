const numFmt = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 });
const moneyFmt = new Intl.NumberFormat("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtNum = (n: number) => numFmt.format(n).replace(/\u00a0|\u202f/g, " ");
export const fmtMoney = (n: number) => `${moneyFmt.format(n).replace(/\u00a0|\u202f/g, " ")} грн`;

export function fmtDate(iso: string) {
  const d = iso.slice(0, 10).split("-");
  return d.length === 3 ? `${d[2]}.${d[1]}.${d[0]}` : iso;
}
export function fmtDateTime(iso: string) {
  return `${fmtDate(iso)} ${iso.slice(11, 16)}`;
}

export function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map(esc).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
