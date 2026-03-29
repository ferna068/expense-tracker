import { prisma } from "@/lib/prisma";

export interface BudgetStatus {
  categoryId: string;
  categoryName: string;
  color: string;
  monthlyBudget: number;
  spent: number;
  percentage: number;
  status: "ok" | "warning" | "exceeded";
}

export async function getBudgetStatuses(
  userId: string,
  month: Date
): Promise<BudgetStatus[]> {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

  const categories = await prisma.category.findMany({
    where: { userId, monthlyBudget: { not: null } },
  });

  const expenses = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      date: { gte: startOfMonth, lte: endOfMonth },
      categoryId: { in: categories.map((c) => c.id) },
    },
    _sum: { amount: true },
  });

  const spendMap = new Map(
    expenses.map((e) => [e.categoryId, e._sum.amount ?? 0])
  );

  return categories
    .filter((c) => c.monthlyBudget != null)
    .map((c) => {
      const spent = spendMap.get(c.id) ?? 0;
      const percentage = (spent / c.monthlyBudget!) * 100;
      const status =
        percentage >= 100 ? "exceeded" : percentage >= 80 ? "warning" : "ok";

      return {
        categoryId: c.id,
        categoryName: c.name,
        color: c.color,
        monthlyBudget: c.monthlyBudget!,
        spent,
        percentage,
        status,
      };
    });
}
