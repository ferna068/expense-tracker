import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createExpenseSchema } from "@/lib/validations";
import { suggestCategory } from "@/lib/categorize";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");

  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      ...(categoryId ? { categoryId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(search
        ? { description: { contains: search } }
        : {}),
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let { categoryId, ...rest } = parsed.data;

    // Auto-categorize if no category provided
    if (!categoryId && rest.description) {
      const categories = await prisma.category.findMany({
        where: { userId: session.user.id },
        select: { id: true, name: true },
      });
      const names = categories.map((c) => c.name);
      const suggested = await suggestCategory(rest.description, names);
      if (suggested) {
        const cat = categories.find((c) => c.name === suggested);
        if (cat) categoryId = cat.id;
      }
    }

    const expense = await prisma.expense.create({
      data: {
        ...rest,
        categoryId: categoryId ?? null,
        userId: session.user.id,
      },
      include: { category: true },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
