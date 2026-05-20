export function parseCSV(text: string) {
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return [];

  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let insideQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const next = cleaned[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);

  const headers = rows[0]?.map((h) => h.trim()) || [];

  return rows.slice(1).map((values) => {
    const obj: Record<string, string | number> = {};
    headers.forEach((header, index) => {
      const value = (values[index] ?? "").trim();
      const numeric = Number(value.replace(/,/g, ""));
      obj[header] = value !== "" && !Number.isNaN(numeric) ? numeric : value;
    });
    return obj;
  });
}
