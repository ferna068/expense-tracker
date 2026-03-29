import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReportClient from "@/components/reports/ReportClient";

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes fiscales</h1>
        <p className="text-gray-500 text-sm mt-1">
          Exporta tus gastos para declaraciones de impuestos
        </p>
      </div>
      <ReportClient categories={categories} />
    </div>
  );
}
