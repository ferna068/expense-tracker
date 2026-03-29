import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCategorySchema } from "@/lib/validations";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const category = await prisma.category.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const category = await prisma.category.findFirst({
    where: { id, userId: session.user.id },
    include: { _count: { select: { expenses: true } } },
  });

  if (!category) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }

  if (category._count.expenses > 0) {
    // Null out categoryId on expenses before deleting
    await prisma.expense.updateMany({
      where: { categoryId: id, userId: session.user.id },
      data: { categoryId: null },
    });
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ message: "Categoría eliminada" });
}
