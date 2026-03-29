import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategorySchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { expenses: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, color, icon, monthlyBudget } = parsed.data;

    const existing = await prisma.category.findUnique({
      where: { name_userId: { name, userId: session.user.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: { name, color, icon, monthlyBudget: monthlyBudget ?? null, userId: session.user.id },
    });

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
