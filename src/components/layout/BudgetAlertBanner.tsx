"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BudgetAlert {
  categoryName: string;
  percentage: number;
  status: "warning" | "exceeded";
}

interface Props {
  alerts: BudgetAlert[];
}

export default function BudgetAlertBanner({ alerts }: Props) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = alerts.filter(
    (a) => !dismissed.includes(a.categoryName)
  );

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map((alert) => (
        <Alert
          key={alert.categoryName}
          className={
            alert.status === "exceeded"
              ? "border-red-300 bg-red-50"
              : "border-yellow-300 bg-yellow-50"
          }
        >
          <AlertTriangle
            className={`h-4 w-4 ${alert.status === "exceeded" ? "text-red-600" : "text-yellow-600"}`}
          />
          <AlertDescription className="flex items-center justify-between">
            <span className={alert.status === "exceeded" ? "text-red-800" : "text-yellow-800"}>
              {alert.status === "exceeded"
                ? `¡Has superado el presupuesto de ${alert.categoryName}! (${Math.round(alert.percentage)}%)`
                : `Te estás acercando al límite de ${alert.categoryName} (${Math.round(alert.percentage)}%)`}
            </span>
            <button
              onClick={() => setDismissed((p) => [...p, alert.categoryName])}
              className="ml-4 opacity-60 hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
