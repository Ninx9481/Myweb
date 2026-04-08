// src/app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Toaster }         from "react-hot-toast";
import { ThemeProvider }   from "@/contexts/ThemeContext";
import { QueryProvider }   from "@/contexts/QueryProvider";
import { Sidebar }         from "@/components/layout/Sidebar";
import "./globals.css";

const playfair = Playfair_Display({
  subsets:  ["latin"],
  variable: "--font-display",
  display:  "swap",
});

const dmSans = DM_Sans({
  subsets:  ["latin"],
  variable: "--font-body",
  display:  "swap",
});

export const metadata: Metadata = {
  title:       "MediaLog — Personal Entertainment Tracker",
  description: "Track movies, TV series, books, and manga in style.",
  icons:       { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${dmSans.variable} font-body antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            <div className="flex min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors duration-300">
              <Sidebar />
              <main className="flex-1 lg:ml-64 min-h-screen">
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "var(--toast-bg, #1a1a1a)",
                  color:      "var(--toast-color, #f0fdf4)",
                  border:     "1px solid var(--toast-border, #22c55e30)",
                  fontFamily: "var(--font-body)",
                },
                success: { iconTheme: { primary: "#22c55e", secondary: "#0a0a0a" } },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
