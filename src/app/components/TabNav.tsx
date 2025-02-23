"use client";

import { ReactNode, useState } from "react";
import { Body } from "@/components/ui/Typography";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabNavProps {
  tabs: Tab[];
  defaultTab?: string;
  currentRound: number;
  totalRounds: number;
  onRoundChange: (round: number) => void;
}

export default function TabNav({ 
  tabs, 
  defaultTab,
  currentRound,
  totalRounds,
  onRoundChange 
}: TabNavProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);

  return (
    <div>
      {/* Round Navigation */}
      <div className="flex justify-between items-center px-4 py-3 bg-onyx-50 dark:bg-onyx-800/50 border-b border-onyx-200 dark:border-onyx-800">
        <div className="flex items-center gap-2">
          <Body.Text variant="sm" className="text-onyx-600 dark:text-onyx-400">
            Round
          </Body.Text>
          <select
            value={currentRound}
            onChange={(e) => onRoundChange(Number(e.target.value))}
            className="bg-white dark:bg-onyx-900 border border-onyx-300 dark:border-onyx-700 rounded-md px-2 py-1 text-sm"
          >
            {Array.from({ length: totalRounds }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Round {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-onyx-200 dark:border-onyx-800 overflow-x-auto">
        <div className="min-w-full sm:min-w-0">
          <nav className="-mb-px flex gap-4 sm:gap-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative min-w-0 flex-1 sm:flex-none overflow-hidden 
                  border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? "border-amethyste-500 text-amethyste-600 dark:text-amethyste-400"
                    : "border-transparent text-onyx-600 hover:border-onyx-300 hover:text-onyx-700 dark:text-onyx-400 dark:hover:border-onyx-700 dark:hover:text-onyx-300"
                  }`}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <Body.Label className={`truncate ${
                  activeTab === tab.id ? "text-amethyste-600 dark:text-amethyste-400" : ""
                }`}>
                  {tab.label}
                </Body.Label>
                {/* Active indicator ring for mobile tap states */}
                <span className="absolute inset-0 rounded-md sm:rounded-none
                  group-focus:ring-2 group-focus:ring-inset group-focus:ring-amethyste-500 sm:group-focus:ring-0" 
                />
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content with smooth transitions */}
      <div className="relative py-6">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`transition-opacity duration-200 ${
              activeTab === tab.id 
                ? "opacity-100" 
                : "absolute inset-0 opacity-0 pointer-events-none"
            }`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}