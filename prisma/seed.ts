import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_CATEGORIES = [
  { name: "Alimentación", color: "#f97316", icon: "utensils", monthlyBudget: 400 },
  { name: "Transporte", color: "#3b82f6", icon: "car", monthlyBudget: 150 },
  { name: "Servicios", color: "#8b5cf6", icon: "zap", monthlyBudget: 200 },
  { name: "Entretenimiento", color: "#ec4899", icon: "film", monthlyBudget: 100 },
  { name: "Salud", color: "#10b981", icon: "heart", monthlyBudget: 150 },
  { name: "Compras", color: "#f59e0b", icon: "shopping-bag", monthlyBudget: 300 },
  { name: "Otros", color: "#6b7280", icon: "tag", monthlyBudget: null },
];

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      password: hashedPassword,
      name: "Usuario Demo",
    },
  });

  const categories: { id: string; name: string }[] = [];
  for (const cat of DEFAULT_CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { name_userId: { name: cat.name, userId: user.id } },
      update: {},
      create: {
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        monthlyBudget: cat.monthlyBudget,
        userId: user.id,
      },
    });
    categories.push({ id: created.id, name: created.name });
  }

  const findCat = (name: string) => categories.find((c) => c.name === name)!;

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

  await prisma.expense.deleteMany({ where: { userId: user.id } });

  const sampleExpenses = [
    { amount: 85.5, description: "Supermercado Carrefour", date: daysAgo(2), categoryId: findCat("Alimentación").id },
    { amount: 45.0, description: "Restaurante El Rincón", date: daysAgo(4), categoryId: findCat("Alimentación").id },
    { amount: 35.0, description: "Abono metro mensual", date: daysAgo(5), categoryId: findCat("Transporte").id },
    { amount: 12.5, description: "Taxi aeropuerto", date: daysAgo(7), categoryId: findCat("Transporte").id },
    { amount: 59.99, description: "Factura electricidad", date: daysAgo(8), categoryId: findCat("Servicios").id },
    { amount: 29.99, description: "Netflix + Spotify", date: daysAgo(10), categoryId: findCat("Entretenimiento").id },
    { amount: 55.0, description: "Consulta médica", date: daysAgo(12), categoryId: findCat("Salud").id },
    { amount: 120.0, description: "Ropa de temporada", date: daysAgo(15), categoryId: findCat("Compras").id },
    { amount: 22.3, description: "Gasolina BP", date: daysAgo(18), categoryId: findCat("Transporte").id },
    { amount: 18.0, description: "Cena con amigos", date: daysAgo(20), categoryId: findCat("Alimentación").id },
  ];

  for (const expense of sampleExpenses) {
    await prisma.expense.create({ data: { ...expense, userId: user.id } });
  }

  console.log("✅ Seed completado");
  console.log("   Email: demo@example.com");
  console.log("   Password: password123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
