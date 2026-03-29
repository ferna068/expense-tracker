import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ScanLine, Receipt } from "lucide-react";
import DeleteExpenseButton from "@/components/expenses/DeleteExpenseButton";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; categoryId?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const { search, categoryId } = await searchParams;

  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      where: {
        userId: session.user.id,
        ...(categoryId ? { categoryId } : {}),
        ...(search ? { description: { contains: search } } : {}),
      },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {expenses.length} gastos · Total: €{total.toFixed(2)}
          </p>
        </div>
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo gasto
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3 flex-wrap">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar gastos..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-48"
        />
        <select
          name="categoryId"
          defaultValue={categoryId ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filtrar
        </Button>
        {(search || categoryId) && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/expenses">Limpiar</Link>
          </Button>
        )}
      </form>

      {/* Expense List */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="bg-gray-100 p-4 rounded-full">
              <Receipt className="h-10 w-10 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-700">No hay gastos</p>
              <p className="text-sm text-gray-500 mt-1">
                {search || categoryId
                  ? "No se encontraron gastos con esos filtros"
                  : "Empieza a registrar tus gastos"}
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/expenses/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir gasto
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/expenses/new">
                  <ScanLine className="h-4 w-4 mr-2" />
                  Escanear ticket
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: expense.category?.color ?? "#6b7280" }}
                  >
                    {expense.description.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                    >
                      {expense.description}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {format(new Date(expense.date), "d MMM yyyy", { locale: es })}
                      </span>
                      {expense.category && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          <span
                            className="w-1.5 h-1.5 rounded-full mr-1"
                            style={{ backgroundColor: expense.category.color }}
                          />
                          {expense.category.name}
                        </Badge>
                      )}
                      {expense.receiptImage && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 gap-1">
                          <ScanLine className="h-2.5 w-2.5" />
                          OCR
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg text-gray-900">
                    €{expense.amount.toFixed(2)}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/expenses/${expense.id}`}>Editar</Link>
                    </Button>
                    <DeleteExpenseButton id={expense.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
