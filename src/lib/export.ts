import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ExpenseWithCategory {
  id: string;
  amount: number;
  description: string;
  date: Date;
  receiptImage: string | null;
  category: { name: string } | null;
}

export function expensesToCSV(expenses: ExpenseWithCategory[]): string {
  const header = ["Fecha", "Descripción", "Categoría", "Monto (€)", "Recibo"];
  const rows = expenses.map((e) => [
    format(new Date(e.date), "yyyy-MM-dd"),
    `"${e.description.replace(/"/g, '""')}"`,
    e.category?.name ?? "Sin categoría",
    e.amount.toFixed(2),
    e.receiptImage ? "Sí" : "No",
  ]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  rows.push(["", "TOTAL", "", total.toFixed(2), ""]);

  return [header, ...rows].map((r) => r.join(",")).join("\n");
}

export async function expensesToPDF(
  expenses: ExpenseWithCategory[],
  range: { from: Date; to: Date }
): Promise<Buffer> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  // Header
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // indigo
  doc.text("Reporte Fiscal de Gastos", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Período: ${format(range.from, "d MMM yyyy", { locale: es })} — ${format(range.to, "d MMM yyyy", { locale: es })}`,
    14,
    32
  );
  doc.text(`Total de gastos: ${expenses.length}`, 14, 40);

  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total: €${total.toFixed(2)}`, 14, 48);

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 52, 196, 52);

  autoTable(doc, {
    startY: 58,
    head: [["Fecha", "Descripción", "Categoría", "Monto (€)"]],
    body: expenses.map((e) => [
      format(new Date(e.date), "dd/MM/yyyy"),
      e.description,
      e.category?.name ?? "Sin categoría",
      `€${e.amount.toFixed(2)}`,
    ]),
    foot: [["", "", "TOTAL", `€${total.toFixed(2)}`]],
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    footStyles: { fillColor: [240, 240, 255], textColor: [0, 0, 0], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 255] },
    styles: { fontSize: 9 },
  });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
