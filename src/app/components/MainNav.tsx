"use client";

import { useState } from "react";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const navLinks = [
  { href: "/", label: "Events" },
  { href: "/rankings", label: "Rankings" },
  { href: "/dashboard", label: "My Dashboard" },
  { href: "/club-overview", label: "Club Overview" },
  { href: "/reglement", label: "Rules" },
];

const categoryLinks = [
  { href: "/rankings?category=ONYX", label: "ONYX", classes: "bg-onyx-100 text-onyx-800 ring-1 ring-onyx-900/10 dark:bg-onyx-800 dark:text-onyx-100 dark:ring-white/10" },
  { href: "/rankings?category=AMÉTHYSTE", label: "AMÉTHYSTE", classes: "bg-amethyste-100 text-amethyste-800 ring-1 ring-amethyste-900/10 dark:bg-amethyste-800 dark:text-amethyste-100 dark:ring-white/10" },
  { href: "/rankings?category=TOPAZE", label: "TOPAZE", classes: "bg-topaze-100 text-topaze-800 ring-1 ring-topaze-900/10 dark:bg-topaze-800 dark:text-topaze-100 dark:ring-white/10" },
  { href: "/rankings?category=DIAMANT", label: "DIAMANT", classes: "bg-diamant-100 text-diamant-800 ring-1 ring-diamant-900/10 dark:bg-diamant-800 dark:text-diamant-100 dark:ring-white/10" },
];

export default function MainNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b border-onyx-200 bg-gradient-to-b from-amethyste-500 to-amethyste-600 shadow-sm dark:border-onyx-800 dark:from-amethyste-900 dark:to-amethyste-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-semibold text-white hover:opacity-90 transition-opacity"
              onClick={() => setIsOpen(false)}
            >
              WWL
            </Link>
            {/* Category Indicators */}
            <div className="ml-8 hidden space-x-4 sm:flex">
              {categoryLinks.map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium
                    hover:ring-2 transition-all duration-150 ${cat.classes}`}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden sm:block">
            <div className="flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-white
                    relative after:absolute after:bottom-0 after:left-0 after:right-0
                    after:h-0.5 after:bg-white after:scale-x-0 after:opacity-0
                    hover:after:scale-x-100 hover:after:opacity-100
                    after:transition-all after:duration-200
                    hover:bg-amethyste-600/50 dark:hover:bg-amethyste-800/50"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/admin"
                className="rounded-md bg-white/10 backdrop-blur-sm px-3 py-2 text-sm font-medium text-white
                  ring-1 ring-white/25 hover:bg-white/20 transition-all duration-150"
              >
                Admin
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-md p-2 text-white
              hover:bg-amethyste-600/50 dark:hover:bg-amethyste-800/50 sm:hidden"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="sm:hidden border-t border-white/20">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium text-white
                  hover:bg-amethyste-600/50 dark:hover:bg-amethyste-800/50"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="block rounded-md bg-white/10 px-3 py-2 text-base font-medium text-white
                ring-1 ring-white/25 hover:bg-white/20"
            >
              Admin
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            {categoryLinks.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                onClick={() => setIsOpen(false)}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cat.classes}`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
