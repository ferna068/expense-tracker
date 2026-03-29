"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CategoryForm from "./CategoryForm";
import type { BudgetStatus } from "@/lib/budgetAlerts";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  monthlyBudget: number | null;
  _count: { expenses: number };
  budgetStatus: BudgetStatus | null;
}

export default function CategoryManager({ categories: initial }: { categories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function refresh() {
    router.refresh();
    setCreateOpen(false);
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Categoría eliminada");
        setCategories((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      } else {
        const json = await res.json();
        toast.error(json.error ?? "Error al eliminar");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva categoría</DialogTitle>
            </DialogHeader>
            <CategoryForm onSuccess={refresh} />
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="bg-gray-100 p-4 rounded-full">
              <Tags className="h-10 w-10 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-700">No hay categorías</p>
              <p className="text-sm text-gray-500 mt-1">Crea tu primera categoría para organizar tus gastos</p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear categoría
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-500">
                        {cat._count.expenses} gasto{cat._count.expenses !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Dialog
                      open={editingId === cat.id}
                      onOpenChange={(o) => setEditingId(o ? cat.id : null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar categoría</DialogTitle>
                        </DialogHeader>
                        <CategoryForm
                          onSuccess={refresh}
                          categoryId={cat.id}
                          defaultValues={{
                            name: cat.name,
                            color: cat.color,
                            icon: cat.icon,
                            monthlyBudget: cat.monthlyBudget ?? undefined,
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                    >
                      {deletingId === cat.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {cat.monthlyBudget != null && cat.budgetStatus && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>€{cat.budgetStatus.spent.toFixed(2)} gastado</span>
                      <div className="flex items-center gap-1.5">
                        <span>€{cat.monthlyBudget.toFixed(2)} presupuesto</span>
                        {cat.budgetStatus.status !== "ok" && (
                          <Badge
                            variant={cat.budgetStatus.status === "exceeded" ? "destructive" : "secondary"}
                            className="text-xs px-1.5 py-0"
                          >
                            {cat.budgetStatus.status === "exceeded" ? "Superado" : "Atención"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress
                      value={Math.min(cat.budgetStatus.percentage, 100)}
                      className={`h-2 ${
                        cat.budgetStatus.status === "exceeded"
                          ? "[&>div]:bg-red-500"
                          : cat.budgetStatus.status === "warning"
                          ? "[&>div]:bg-yellow-500"
                          : ""
                      }`}
                    />
                  </div>
                )}

                {cat.monthlyBudget == null && (
                  <p className="mt-3 text-xs text-gray-400 italic">Sin límite de presupuesto</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
