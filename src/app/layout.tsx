import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rastreador de Gastos",
  description: "Controla tus gastos con OCR y análisis automático",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50">
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
