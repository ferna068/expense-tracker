import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { ScanLine } from "lucide-react";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const { id } = await params;

  const [expense, categories] = await Promise.all([
    prisma.expense.findFirst({
      where: { id, userId: session.user.id },
      include: { category: true },
    }),
    prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!expense) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar gasto</h1>
        <p className="text-gray-500 text-sm mt-1">Modifica los datos del gasto</p>
      </div>

      {expense.receiptImage && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-indigo-600" />
              Ticket escaneado
              <Badge variant="secondary" className="text-xs">OCR</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={expense.receiptImage}
              alt="Ticket"
              className="max-h-64 object-contain rounded-lg border border-gray-200"
            />
            {expense.ocrText && (
              <details className="mt-3">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Ver texto extraído por OCR
                </summary>
                <pre className="mt-2 text-xs bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap font-mono overflow-auto max-h-40">
                  {expense.ocrText}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del gasto</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            categories={categories}
            expenseId={expense.id}
            defaultValues={{
              amount: expense.amount,
              description: expense.description,
              date: expense.date,
              categoryId: expense.categoryId ?? undefined,
              receiptImage: expense.receiptImage ?? undefined,
              ocrText: expense.ocrText ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
