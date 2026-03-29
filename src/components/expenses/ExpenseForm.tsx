"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface FormValues {
  amount: string;
  description: string;
  date: string;
  categoryId: string;
}

interface Props {
  categories: Category[];
  defaultValues?: {
    amount?: number;
    description?: string;
    date?: Date | string;
    categoryId?: string;
    receiptImage?: string;
    ocrText?: string;
  };
  expenseId?: string;
}

export default function ExpenseForm({ categories, defaultValues, expenseId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      amount: defaultValues?.amount?.toString() ?? "",
      description: defaultValues?.description ?? "",
      date: defaultValues?.date
        ? format(new Date(defaultValues.date), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      categoryId: defaultValues?.categoryId ?? "",
    },
  });

  useEffect(() => {
    if (defaultValues?.amount !== undefined)
      form.setValue("amount", defaultValues.amount.toString());
    if (defaultValues?.description)
      form.setValue("description", defaultValues.description);
    if (defaultValues?.date)
      form.setValue("date", format(new Date(defaultValues.date), "yyyy-MM-dd"));
    if (defaultValues?.categoryId)
      form.setValue("categoryId", defaultValues.categoryId);
  }, [defaultValues, form]);

  async function onSubmit(data: FormValues) {
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      form.setError("amount", { message: "Monto inválido" });
      return;
    }
    if (!data.description.trim()) {
      form.setError("description", { message: "La descripción es requerida" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        amount,
        description: data.description.trim(),
        date: new Date(data.date),
        categoryId: data.categoryId || undefined,
        receiptImage: defaultValues?.receiptImage,
        ocrText: defaultValues?.ocrText,
      };

      const url = expenseId ? `/api/expenses/${expenseId}` : "/api/expenses";
      const method = expenseId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Error al guardar");
      } else {
        toast.success(expenseId ? "Gasto actualizado" : "Gasto registrado");
        router.push("/expenses");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto (€)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Supermercado, Restaurante..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría (opcional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {expenseId ? "Actualizar gasto" : "Registrar gasto"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
