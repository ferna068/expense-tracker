import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBudgetStatuses } from "@/lib/budgetAlerts";
import CategoryManager from "@/components/categories/CategoryManager";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const [categories, budgetStatuses] = await Promise.all([
    prisma.category.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: "asc" },
    }),
    getBudgetStatuses(session.user.id, new Date()),
  ]);

  const budgetMap = new Map(
    budgetStatuses.map((b) => [b.categoryId, b])
  );

  const categoriesWithBudget = categories.map((cat) => ({
    ...cat,
    budgetStatus: budgetMap.get(cat.id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestiona tus categorías y presupuestos mensuales
        </p>
      </div>
      <CategoryManager categories={categoriesWithBudget} />
    </div>
  );
}
