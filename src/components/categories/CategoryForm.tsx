"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { createCategorySchema, type CreateCategoryInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const PRESET_COLORS = [
  "#f97316", "#3b82f6", "#8b5cf6", "#ec4899",
  "#10b981", "#f59e0b", "#6b7280", "#ef4444",
  "#06b6d4", "#84cc16",
];

interface Props {
  onSuccess: () => void;
  defaultValues?: Partial<CreateCategoryInput>;
  categoryId?: string;
}

export default function CategoryForm({ onSuccess, defaultValues, categoryId }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      color: defaultValues?.color ?? "#6366f1",
      icon: defaultValues?.icon ?? "tag",
      monthlyBudget: defaultValues?.monthlyBudget ?? undefined,
    },
  });

  async function onSubmit(data: CreateCategoryInput) {
    setLoading(true);
    try {
      const url = categoryId ? `/api/categories/${categoryId}` : "/api/categories";
      const method = categoryId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          monthlyBudget: data.monthlyBudget || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Error al guardar");
      } else {
        toast.success(categoryId ? "Categoría actualizada" : "Categoría creada");
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  }

  const selectedColor = form.watch("color");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Alimentación, Transporte..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                          field.value === color ? "ring-2 ring-offset-2 ring-gray-900 scale-110" : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => field.onChange(color)}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <span className="text-sm text-gray-500">O elige un color personalizado</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monthlyBudget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Presupuesto mensual (€) <span className="text-gray-400 font-normal">— opcional</span></FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Sin límite"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex-shrink-0"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-sm text-gray-600">
            {form.watch("name") || "Nueva categoría"}
          </span>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {categoryId ? "Actualizar categoría" : "Crear categoría"}
        </Button>
      </form>
    </Form>
  );
}
