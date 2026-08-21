"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  orientation?: "horizontal" | "vertical";
}

export function SidebarTabs({
  tabs,
  activeTab,
  onTabChange,
  orientation = "vertical",
}: SidebarTabsProps) {
  const [showLabels, setShowLabels] = useState(true);

  if (orientation === "horizontal") {
    return (
      <div className="flex border-b border-white overflow-x-auto scrollbar-hide shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold
              whitespace-nowrap shrink-0
              transition-all duration-200
              ${
                activeTab === tab.id
                  ? "text-white border-b-2 border-white bg-white/[3%]"
                  : "text-white hover:text-white bg-transparent"
              }
            `}
            title={tab.label}
          >
            <span className="text-sm sm:text-sm">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[13px] font-bold rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className="flex flex-col border-b border-white shrink-0">
      {/* Toggle labels - hidden on mobile */}
      <button
        onClick={() => setShowLabels(!showLabels)}
        className="hidden md:flex items-center justify-between px-3 py-2 text-sm font-semibold text-white hover:text-white bg-white/[1%] transition-colors"
      >
        <span>Ferramentas</span>
        <ChevronRight
          className={`h-3 w-3 transition-transform ${showLabels ? "rotate-90" : ""}`}
        />
      </button>

      {/* Tabs */}
      <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-3 py-2.5 text-sm font-semibold
              whitespace-nowrap md:whitespace-normal shrink-0 md:shrink
              transition-all duration-200 border-b md:border-b md:border-l-2
              ${
                activeTab === tab.id
                  ? "text-white border-l-white border-white bg-white/[3%]"
                  : "text-white hover:text-white border-l-transparent hover:border-white bg-transparent"
              }
            `}
            title={tab.label}
          >
            <span className="text-sm shrink-0">{tab.icon}</span>
            {showLabels && <span className="hidden md:inline">{tab.label}</span>}
            {tab.badge && (
              <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[13px] font-bold rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
