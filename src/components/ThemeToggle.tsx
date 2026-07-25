"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export const THEME_STORAGE_KEY = "wwl-theme";

/**
 * Script exécuté avant le premier rendu : applique le thème enregistré (ou la
 * préférence système) sur <html> pour éviter un flash blanc au chargement.
 * Doit rester synchrone et sans dépendance — il tourne avant tout le JS de l'app.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.toggle('dark',d);
}catch(e){}})();`;

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // Navigation privée : le thème ne survivra pas au rechargement, tant pis.
  }
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  // Le serveur ignore la préférence : on ne rend l'icône qu'après montage,
  // sinon le HTML rendu côté serveur contredit l'état réel de <html>.
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    applyTheme(next);
    setIsDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-white
        ring-1 ring-white/25 transition-colors hover:bg-white/20 ${className}`}
    >
      {isDark === null ? (
        <span className="h-5 w-5" />
      ) : isDark ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
}
