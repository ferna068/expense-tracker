import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateExpenseSchema } from "@/lib/validations";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id, userId: session.user.id },
    include: { category: true },
  });

  if (!expense) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(expense);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.expense.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const updated = await prisma.expense.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
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

  const existing = await prisma.expense.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ message: "Gasto eliminado" });
}
