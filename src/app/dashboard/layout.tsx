import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BudgetAlertBanner from "@/components/layout/BudgetAlertBanner";
import { getBudgetStatuses } from "@/lib/budgetAlerts";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const alerts = await getBudgetStatuses(session.user.id, new Date());
  const activeAlerts = alerts
    .filter((a) => a.status !== "ok")
    .map(({ categoryName, percentage, status }) => ({
      categoryName,
      percentage,
      status: status as "warning" | "exceeded",
    }));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6 max-w-7xl mx-auto">
          {activeAlerts.length > 0 && (
            <BudgetAlertBanner alerts={activeAlerts} />
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
