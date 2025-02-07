import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <nav className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Link 
                  href="/"
                  className="text-xl font-semibold text-gray-900 dark:text-white"
                >
                  WWL
                </Link>
                {/* Category Indicators */}
                <div className="ml-8 hidden space-x-4 sm:flex">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                    ONYX
                  </span>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300">
                    AMÉTHYSTE
                  </span>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    TOPAZE
                  </span>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                    DIAMANT
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="hidden sm:block">
                <div className="flex items-center space-x-4">
                  <Link
                    href="/"
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Events
                  </Link>
                  <Link
                    href="/reglement"
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Rules
                  </Link>
                  <Link
                    href="/admin"
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Admin
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {children}
        </main>

        <footer className="border-t border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              WWL - FAIZERS Scrabble Club Management System
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
