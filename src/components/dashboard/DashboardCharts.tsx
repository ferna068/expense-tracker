"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface DailyDataPoint {
  day: string;
  amount: number;
}

export interface CategoryDataPoint {
  name: string;
  color: string;
  amount: number;
}

interface Props {
  dailyData: DailyDataPoint[];
  categoryData: CategoryDataPoint[];
  totalMonthly: number;
}

const barConfig: ChartConfig = {
  amount: { label: "Gasto (€)", color: "#6366f1" },
};

export default function DashboardCharts({ dailyData, categoryData, totalMonthly }: Props) {
  // Build pie chart config dynamically from category colors
  const pieConfig: ChartConfig = Object.fromEntries(
    categoryData.map((c) => [c.name, { label: c.name, color: c.color }])
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily spending bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gasto diario este mes</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.every((d) => d.amount === 0) ? (
            <p className="text-sm text-gray-500 text-center py-10">
              Sin gastos registrados este mes
            </p>
          ) : (
            <ChartContainer config={barConfig} className="h-52 w-full">
              <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  interval={4}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: number) => `€${v}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        `€${Number(value).toFixed(2)}`,
                        "Gasto",
                      ]}
                    />
                  }
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Category pie chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gastos por categoría (este mes)</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">
              Sin gastos este mes
            </p>
          ) : (
            <div className="flex items-center gap-6">
              <ChartContainer config={pieConfig} className="h-44 w-44 shrink-0">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [`€${Number(value).toFixed(2)}`]}
                      />
                    }
                  />
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={66}
                    paddingAngle={2}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              <div className="flex-1 space-y-2 min-w-0">
                {categoryData.map((cat) => {
                  const pct =
                    totalMonthly > 0
                      ? Math.round((cat.amount / totalMonthly) * 100)
                      : 0;
                  return (
                    <div key={cat.name} className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-gray-700 truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 shrink-0">
                        <span className="font-medium text-gray-800">
                          €{cat.amount.toFixed(2)}
                        </span>
                        <span className="text-gray-400">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
