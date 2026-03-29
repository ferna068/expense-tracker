"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { FileText, Download, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  receiptImage: string | null;
  category: { name: string; color: string } | null;
}

interface Props {
  categories: Category[];
}

const QUICK_RANGES = [
  { label: "Este mes", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Mes anterior", getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "Últimos 3 meses", getValue: () => ({ from: startOfMonth(subMonths(new Date(), 2)), to: endOfMonth(new Date()) }) },
  { label: "Este año", getValue: () => ({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date(new Date().getFullYear(), 11, 31) }) },
];

export default function ReportClient({ categories }: Props) {
  const [from, setFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [categoryId, setCategoryId] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  async function fetchExpenses() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      if (categoryId) params.set("categoryId", categoryId);
      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar gastos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  function applyQuickRange(range: { from: Date; to: Date }) {
    setFrom(format(range.from, "yyyy-MM-dd"));
    setTo(format(range.to, "yyyy-MM-dd"));
  }

  function handleExport(exportFormat: "csv" | "pdf") {
    setExporting(exportFormat);
    const params = new URLSearchParams({ format: exportFormat, from, to });
    if (categoryId) params.set("categoryId", categoryId);
    const url = `/api/reports/export?${params}`;
    const link = document.createElement("a");
    link.href = url;
    link.click();
    setTimeout(() => setExporting(null), 2000);
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros del reporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick ranges */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Períodos rápidos</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_RANGES.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => applyQuickRange(r.getValue())}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Desde</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hasta</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
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
            </div>
          </div>

          <Button onClick={fetchExpenses} disabled={loading} variant="outline">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualizar reporte
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      {!loading && expenses.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500">Gastos</p>
              <p className="text-2xl font-bold">{expenses.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold">€{total.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500">Con ticket</p>
              <p className="text-2xl font-bold">
                {expenses.filter((e) => e.receiptImage).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export buttons */}
      {!loading && expenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                onClick={() => handleExport("csv")}
                variant="outline"
                disabled={exporting !== null}
                className="gap-2"
              >
                {exporting === "csv" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Descargar CSV
              </Button>
              <Button
                onClick={() => handleExport("pdf")}
                disabled={exporting !== null}
                className="gap-2"
              >
                {exporting === "pdf" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Descargar PDF
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              El PDF incluye tabla de gastos con totales, ideal para declaraciones fiscales.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Preview table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Vista previa
            {!loading && (
              <Badge variant="secondary" className="ml-2">
                {expenses.length} resultados
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay gastos en el período seleccionado</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(expense.date), "d MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        {expense.category ? (
                          <Badge variant="secondary" className="text-xs">
                            <span
                              className="w-1.5 h-1.5 rounded-full mr-1"
                              style={{ backgroundColor: expense.category.color }}
                            />
                            {expense.category.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">Sin categoría</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        €{expense.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-3" />
              <div className="flex justify-end">
                <span className="font-bold text-lg">
                  Total: €{total.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
