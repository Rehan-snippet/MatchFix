/**
 * Utility to export tabular data to CSV and trigger browser file download
 * @param {string} filename - Base name for the generated CSV file
 * @param {Array<{ key: string, label: string, getter?: (row: any) => any }>} headers - Column configuration
 * @param {Array<any>} rows - List of data objects to export
 */
export function exportToCsv(filename, headers, rows) {
  if (!rows || !rows.length) {
    alert('No data records available to export.');
    return;
  }

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map((h) => escapeCell(h.label)).join(',');
  const bodyLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = h.getter ? h.getter(row) : row[h.key];
        return escapeCell(val);
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [headerLine, ...bodyLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
