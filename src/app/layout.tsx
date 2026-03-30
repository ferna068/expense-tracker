import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import ThemeProvider from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rastreador de Gastos",
  description: "Controla tus gastos con OCR y análisis automático",
};

// Inline script to set dark class before first paint — avoids flash
const themeScript = `
(function(){
  var t=localStorage.getItem('theme');
  if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}
  if(t==='dark'){document.documentElement.classList.add('dark');}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
