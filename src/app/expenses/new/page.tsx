"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReceiptUpload from "@/components/expenses/ReceiptUpload";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { ScanLine, PenLine, Sparkles } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface OcrFormData {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: string;
  receiptImage?: string;
  ocrText?: string;
}

export default function NewExpensePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [ocrData, setOcrData] = useState<OcrFormData | null>(null);
  const [activeTab, setActiveTab] = useState("scan");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data));
  }, []);

  function handleOcrResult(result: {
    ocrText: string;
    receiptImage: string;
    parsed: {
      amount: number | null;
      date: string | null;
      merchant: string | null;
      description: string | null;
      suggestedCategoryId: string | null;
    };
  }) {
    setOcrData({
      amount: result.parsed.amount ?? undefined,
      description: result.parsed.description ?? result.parsed.merchant ?? undefined,
      date: result.parsed.date ?? undefined,
      categoryId: result.parsed.suggestedCategoryId ?? undefined,
      receiptImage: result.receiptImage,
      ocrText: result.ocrText,
    });
    setActiveTab("manual");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo gasto</h1>
        <p className="text-gray-500 text-sm mt-1">
          Escanea un ticket o introduce los datos manualmente
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scan" className="gap-2">
            <ScanLine className="h-4 w-4" />
            Escanear ticket
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <PenLine className="h-4 w-4" />
            Entrada manual
            {ocrData && (
              <Badge variant="secondary" className="ml-1 text-xs">
                OCR
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-indigo-600" />
                Escaneo OCR
              </CardTitle>
              <CardDescription>
                Fotografía o sube un ticket para extraer los datos automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReceiptUpload onResult={handleOcrResult} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PenLine className="h-5 w-5 text-indigo-600" />
                Datos del gasto
              </CardTitle>
              {ocrData && (
                <CardDescription className="flex items-center gap-1 text-indigo-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  Datos completados automáticamente por OCR. Revisa antes de guardar.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <ExpenseForm
                categories={categories}
                defaultValues={
                  ocrData
                    ? {
                        amount: ocrData.amount,
                        description: ocrData.description,
                        date: ocrData.date ? new Date(ocrData.date) : undefined,
                        categoryId: ocrData.categoryId,
                        receiptImage: ocrData.receiptImage,
                        ocrText: ocrData.ocrText,
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
