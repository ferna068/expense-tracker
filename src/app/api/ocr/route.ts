import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeReceipt } from "@/lib/ocr";
import { suggestCategory } from "@/lib/categorize";
import { uploadReceiptImage } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se encontró archivo" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo supera el límite de 5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const [receiptImage, { ocrText, parsed }] = await Promise.all([
      uploadReceiptImage(buffer, file.type),
      analyzeReceipt(buffer, file.type),
    ]);

    // Suggest category from OCR-extracted merchant/description
    let suggestedCategoryId: string | null = null;
    const textForCategorization = [parsed.merchant, parsed.description]
      .filter(Boolean)
      .join(" ");

    if (textForCategorization) {
      const categories = await prisma.category.findMany({
        where: { userId: session.user.id },
        select: { id: true, name: true },
      });
      const suggested = await suggestCategory(
        textForCategorization,
        categories.map((c) => c.name)
      );
      if (suggested) {
        const cat = categories.find((c) => c.name === suggested);
        if (cat) suggestedCategoryId = cat.id;
      }
    }

    return NextResponse.json({
      ocrText,
      receiptImage,
      parsed: {
        amount: parsed.amount,
        date: parsed.date?.toISOString() ?? null,
        merchant: parsed.merchant,
        description: parsed.description,
        suggestedCategoryId,
      },
    });
  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json({ error: "Error procesando imagen" }, { status: 500 });
  }
}
