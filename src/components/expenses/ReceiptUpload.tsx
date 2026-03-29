"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, Loader2, X, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OcrResult {
  ocrText: string;
  receiptImage: string;
  parsed: {
    amount: number | null;
    date: string | null;
    merchant: string | null;
    description: string | null;
    suggestedCategoryId: string | null;
  };
}

interface Props {
  onResult: (result: OcrResult) => void;
}

export default function ReceiptUpload({ onResult }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen");
      return;
    }

    setIsProcessing(true);
    setPreview(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Error al procesar la imagen");
        return;
      }

      toast.success("Ticket procesado correctamente");
      onResult(data as OcrResult);
    } catch {
      toast.error("Error al procesar la imagen");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            <p className="text-sm text-gray-600">Reconociendo texto del ticket...</p>
            <p className="text-xs text-gray-400">Esto puede tardar unos segundos</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="bg-indigo-100 p-4 rounded-full">
              <ScanLine className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Arrastra tu ticket aquí</p>
              <p className="text-sm text-gray-500 mt-1">o haz clic para seleccionar</p>
            </div>
            <p className="text-xs text-gray-400">PNG, JPG, WEBP hasta 5MB</p>
          </div>
        )}
      </div>

      {preview && !isProcessing && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Vista previa del ticket"
            className="h-32 object-contain rounded-lg border border-gray-200"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 bg-white border border-gray-200 rounded-full hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              setPreview(null);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Upload className="h-4 w-4 text-gray-400" />
        <p className="text-xs text-gray-500">
          El OCR extraerá automáticamente el monto, fecha y comercio del ticket
        </p>
      </div>
    </div>
  );
}
