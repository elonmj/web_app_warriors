import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
    <html lang="en" className={`${dmSans.variable}`}>
      <body className="antialiased font-sans bg-onyx-50 dark:bg-onyx-950">
        <nav className="border-b border-onyx-200 bg-gradient-to-b from-amethyste-500 to-amethyste-600 shadow-sm dark:border-onyx-800 dark:from-amethyste-900 dark:to-amethyste-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Link 
                  href="/"
                  className="text-xl font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  WWL
                </Link>
                {/* Category Indicators */}
                <div className="ml-8 hidden space-x-4 sm:flex">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium 
                    bg-onyx-100 text-onyx-800 ring-1 ring-onyx-900/10 hover:ring-2 transition-all duration-150
                    dark:bg-onyx-800 dark:text-onyx-100 dark:ring-white/10">
                    ONYX
                  </span>
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium 
                    bg-amethyste-100 text-amethyste-800 ring-1 ring-amethyste-900/10 hover:ring-2 transition-all duration-150
                    dark:bg-amethyste-800 dark:text-amethyste-100 dark:ring-white/10">
                    AMÉTHYSTE
                  </span>
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium 
                    bg-topaze-100 text-topaze-800 ring-1 ring-topaze-900/10 hover:ring-2 transition-all duration-150
                    dark:bg-topaze-800 dark:text-topaze-100 dark:ring-white/10">
                    TOPAZE
                  </span>
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium 
                    bg-diamant-100 text-diamant-800 ring-1 ring-diamant-900/10 hover:ring-2 transition-all duration-150
                    dark:bg-diamant-800 dark:text-diamant-100 dark:ring-white/10">
                    DIAMANT
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="hidden sm:block">
                <div className="flex items-center space-x-4">
                  <Link
                    href="/"
                    className="rounded-md px-3 py-2 text-sm font-medium text-white
                      relative after:absolute after:bottom-0 after:left-0 after:right-0
                      after:h-0.5 after:bg-white after:scale-x-0 after:opacity-0
                      hover:after:scale-x-100 hover:after:opacity-100
                      after:transition-all after:duration-200
                      hover:bg-amethyste-600/50 dark:hover:bg-amethyste-800/50"
                  >
                    Events
                  </Link>
                  <Link
                    href="/rankings"
                    className="rounded-md px-3 py-2 text-sm font-medium text-white
                      relative after:absolute after:bottom-0 after:left-0 after:right-0
                      after:h-0.5 after:bg-white after:scale-x-0 after:opacity-0
                      hover:after:scale-x-100 hover:after:opacity-100
                      after:transition-all after:duration-200
                      hover:bg-amethyste-600/50 dark:hover:bg-amethyste-800/50"
                  >
                    Rankings
                  </Link>
                  <Link
                    href="/reglement"
                    className="rounded-md px-3 py-2 text-sm font-medium text-white
                      relative after:absolute after:bottom-0 after:left-0 after:right-0
                      after:h-0.5 after:bg-white after:scale-x-0 after:opacity-0
                      hover:after:scale-x-100 hover:after:opacity-100
                      after:transition-all after:duration-200
                      hover:bg-amethyste-600/50 dark:hover:bg-amethyste-800/50"
                  >
                    Rules
                  </Link>
                  <Link
                    href="/admin"
                    className="rounded-md bg-white/10 backdrop-blur-sm px-3 py-2 text-sm font-medium text-white 
                      ring-1 ring-white/25 hover:bg-white/20 transition-all duration-150"
                  >
                    Admin
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

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
        </footer>
      </body>
    </html>
  );
}
