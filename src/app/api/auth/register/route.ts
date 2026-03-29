import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6),
});

const DEFAULT_CATEGORIES = [
  { name: "Alimentación", color: "#f97316", icon: "utensils", monthlyBudget: 400 },
  { name: "Transporte", color: "#3b82f6", icon: "car", monthlyBudget: 150 },
  { name: "Servicios", color: "#8b5cf6", icon: "zap", monthlyBudget: 200 },
  { name: "Entretenimiento", color: "#ec4899", icon: "film", monthlyBudget: 100 },
  { name: "Salud", color: "#10b981", icon: "heart", monthlyBudget: 150 },
  { name: "Compras", color: "#f59e0b", icon: "shopping-bag", monthlyBudget: 300 },
  { name: "Otros", color: "#6b7280", icon: "tag", monthlyBudget: null },
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword },
    });

    // Create default categories for new user
    for (const cat of DEFAULT_CATEGORIES) {
      await prisma.category.create({
        data: { ...cat, userId: user.id },
      });
    }

    return NextResponse.json(
      { message: "Usuario creado exitosamente" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
