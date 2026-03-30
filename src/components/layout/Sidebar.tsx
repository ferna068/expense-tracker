"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import {
  LayoutDashboard,
  CreditCard,
  Tags,
  FileText,
  LogOut,
  Receipt,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Gastos", icon: CreditCard },
  { href: "/categories", label: "Categorías", icon: Tags },
  { href: "/reports", label: "Reportes", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">GastoTrack</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Rastreador de gastos</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-slate-700 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Modo claro" : "Modo oscuro"}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
