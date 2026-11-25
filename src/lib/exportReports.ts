"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (val: string | number) => {
    const s = String(val ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerBlobDownload(blob, `${filename}.csv`);
}

export function downloadExcel(filename: string, sheetName: string, headers: string[], rows: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function downloadPDF(
  filename: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(234, 80, 3);
  doc.text("Accountio AI | AI Munshi", 14, 16);

  doc.setFontSize(13);
  doc.setTextColor(23, 23, 23);
  doc.text(title, 14, 25);

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`${subtitle}  •  DEMO REPORT (Local Demo Data)`, 14, 31);

  autoTable(doc, {
    startY: 37,
    head: [headers],
    body: rows,
    headStyles: { fillColor: [234, 80, 3], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
  });

  doc.save(`${filename}.pdf`);
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
