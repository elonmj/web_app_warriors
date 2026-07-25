import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import MainNav from "./components/MainNav";
import { THEME_INIT_SCRIPT } from "@/components/ThemeToggle";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: "WWL - FAIZERS Scrabble Club",
  description: "Web App Warriors League - FAIZERS Scrabble Club Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased font-sans bg-onyx-50 dark:bg-onyx-950">
        <MainNav />

        <main className="min-h-screen w-full">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        <footer className="mt-auto border-t border-onyx-200 bg-white py-8 dark:border-onyx-800 dark:bg-onyx-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-onyx-500 dark:text-onyx-400">
              WWL - FAIZERS Scrabble Club Management System
            </div>
          </div>
          <Toaster position="top-right" richColors />
        </footer>
      </body>
    </html>
  );
}
