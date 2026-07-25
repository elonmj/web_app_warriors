"use client";

import { ReactNode, useState } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabNavProps {
  tabs: Tab[];
  defaultTab?: string;
}

export default function TabNav({ tabs, defaultTab }: TabNavProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div>
      {/* Barre collante : sur mobile on scrolle loin dans une liste, l'accès aux
          autres onglets ne doit pas obliger à remonter. */}
      <div className="sticky top-0 z-20 border-b border-onyx-200 bg-white/95 backdrop-blur
        dark:border-onyx-800 dark:bg-onyx-900/95">
        <nav className="flex" aria-label="Sections de la ronde">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`flex-1 whitespace-nowrap border-b-2 px-1 py-3 text-xs font-medium
                transition-colors sm:text-sm
                ${activeTab === tab.id
                  ? "border-amethyste-500 text-amethyste-600 dark:text-amethyste-400"
                  : "border-transparent text-onyx-600 hover:text-onyx-900 dark:text-onyx-400 dark:hover:text-onyx-200"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Seul l'onglet actif est monté : les trois autres représentaient
          l'essentiel du poids de la page sur mobile. */}
      <div role="tabpanel" aria-label={active.label}>
        {active.content}
      </div>
    </div>
  );
}
