import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportQuerySchema } from "@/lib/validations";
import { expensesToCSV, expensesToPDF } from "@/lib/export";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  const parsed = exportQuerySchema.safeParse({
    format: searchParams.get("format"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    categoryId: searchParams.get("categoryId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const { format, from, to, categoryId } = parsed.data;

  const toEndOfDay = new Date(to);
  toEndOfDay.setHours(23, 59, 59);

  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      date: { gte: from, lte: toEndOfDay },
      ...(categoryId ? { categoryId } : {}),
    },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  if (format === "csv") {
    const csv = expensesToCSV(expenses);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gastos-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // PDF
  const pdf = await expensesToPDF(expenses, { from, to });
  return new Response(pdf.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="gastos-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
