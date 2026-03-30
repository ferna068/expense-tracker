import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBudgetStatuses } from "@/lib/budgetAlerts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, CreditCard, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [monthlyExpenses, dailyExpenses, recentExpenses, budgetStatuses, categoryBreakdown] =
    await Promise.all([
      prisma.expense.aggregate({
        where: {
          userId: session.user.id,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.findMany({
        where: {
          userId: session.user.id,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { amount: true, date: true },
      }),
      prisma.expense.findMany({
        where: { userId: session.user.id },
        include: { category: true },
        orderBy: { date: "desc" },
        take: 5,
      }),
      getBudgetStatuses(session.user.id, now),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: {
          userId: session.user.id,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
    ]);

  const totalMonthly = monthlyExpenses._sum.amount ?? 0;
  const totalBudget = budgetStatuses.reduce((s, b) => s + b.monthlyBudget, 0);
  const alertCount = budgetStatuses.filter((b) => b.status !== "ok").length;

  // Fetch category names for breakdown
  const categoryIds = categoryBreakdown.map((c) => c.categoryId).filter(Boolean) as string[];
  const categoriesData = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  });
  const catMap = new Map(categoriesData.map((c) => [c.id, c]));

  // Build daily data: one point per day in the current month
  const dailyMap = new Map<number, number>();
  for (const expense of dailyExpenses) {
    const day = new Date(expense.date).getDate();
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + expense.amount);
  }
  const daysInMonth = endOfMonth.getDate();
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
    day: String(i + 1),
    amount: Math.round((dailyMap.get(i + 1) ?? 0) * 100) / 100,
  }));

  // Build category data for pie chart
  const categoryData = categoryBreakdown.map((item) => {
    const cat = item.categoryId ? catMap.get(item.categoryId) : null;
    return {
      name: cat?.name ?? "Sin categoría",
      color: cat?.color ?? "#6b7280",
      amount: Math.round((item._sum.amount ?? 0) * 100) / 100,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            {format(now, "MMMM yyyy", { locale: es })}
          </p>
        </div>
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo gasto
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Gasto este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
              €{totalMonthly.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {monthlyExpenses._count} transacciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Presupuesto total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
              €{totalBudget.toFixed(2)}
            </p>
            {totalBudget > 0 && (
              <div className="mt-2">
                <Progress
                  value={Math.min((totalMonthly / totalBudget) * 100, 100)}
                  className="h-2"
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {Math.round((totalMonthly / totalBudget) * 100)}% utilizado
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertas de presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{alertCount}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {alertCount === 0
                ? "Todo en orden"
                : `${alertCount} categoría${alertCount > 1 ? "s" : ""} con alerta`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <DashboardCharts
        dailyData={dailyData}
        categoryData={categoryData}
        totalMonthly={totalMonthly}
      />

      {/* Budget Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado de presupuestos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {budgetStatuses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay categorías con presupuesto configurado.{" "}
              <Link href="/categories" className="text-indigo-600 hover:underline">
                Configúralos aquí
              </Link>
            </p>
          ) : (
            budgetStatuses.map((b) => (
              <div key={b.categoryId}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="font-medium text-gray-700 dark:text-slate-300">{b.categoryName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-slate-400">
                      €{b.spent.toFixed(2)} / €{b.monthlyBudget.toFixed(2)}
                    </span>
                    {b.status !== "ok" && (
                      <Badge
                        variant={b.status === "exceeded" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {b.status === "exceeded" ? "Superado" : "Atención"}
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress
                  value={Math.min(b.percentage, 100)}
                  className={`h-2 ${
                    b.status === "exceeded"
                      ? "[&>div]:bg-red-500"
                      : b.status === "warning"
                      ? "[&>div]:bg-yellow-500"
                      : ""
                  }`}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Gastos recientes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/expenses">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay gastos registrados.{" "}
              <Link href="/expenses/new" className="text-indigo-600 hover:underline">
                Añade tu primer gasto
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <Link
                  key={expense.id}
                  href={`/expenses/${expense.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: expense.category?.color ?? "#6b7280" }}
                    >
                      {expense.description.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        {expense.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {expense.category?.name ?? "Sin categoría"} ·{" "}
                        {format(new Date(expense.date), "d MMM", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-slate-100">
                    €{expense.amount.toFixed(2)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
