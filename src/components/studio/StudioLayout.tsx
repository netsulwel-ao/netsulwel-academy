"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

interface StudioLayoutProps {
  header: React.ReactNode;
  stage: React.ReactNode;
  controlsBar: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarTabs?: React.ReactNode;
  className?: string;
}

export function StudioLayout({
  header,
  stage,
  controlsBar,
  sidebar,
  sidebarTabs,
  className = "",
}: StudioLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`flex flex-col h-screen bg-[#0a0a0c] overflow-hidden ${className}`}>
      {/* Header - Desktop Only */}
      <div className="hidden md:block h-11 min-h-[44px] bg-[#0e0e11] border-b border-white/8 shrink-0">
        {header}
      </div>

      {/* Main Content - Flex Layout */}
      <div className="flex flex-1 min-h-0 gap-0 md:gap-0">
        {/* Stage (video do professor) - Main Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-black transition-all duration-300 ${
            collapsed ? "md:max-w-full" : "md:flex-1"
          }`}
        >
          {/* Mobile Header - Responsivo */}
          <div className="md:hidden h-10 bg-[#0e0e11] border-b border-white/8 flex items-center px-3 gap-2 shrink-0">
            {header}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="ml-auto flex items-center justify-center h-8 w-8 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
              title={sidebarOpen ? "Fechar painel" : "Abrir painel"}
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          {/* Stage - Video Display */}
          <div className="flex-1 relative min-h-0 flex items-center justify-center">
            {stage}
          </div>

          {/* Controls Bar - Bottom */}
          <div className="shrink-0">{controlsBar}</div>
        </div>

        {/* Sidebar - Responsivo */}
        <div
          className={`
            bg-[#0e0e11] border-l border-white/8
            transition-all duration-300 ease-out shrink-0
            overflow-hidden
            ${
              sidebarOpen
                ? "w-full md:w-[280px] lg:w-[320px]"
                : "w-0 md:w-[40px]"
            }
          `}
        >
          {/* Sidebar Header (Tabs) */}
          {sidebarTabs && (
            <div className={sidebarOpen ? "block" : "hidden md:block"}>
              {sidebarTabs}
            </div>
          )}

          {/* Sidebar Content */}
          <div
            className={`
              flex-1 overflow-hidden
              ${sidebarOpen ? "block" : "hidden md:block"}
            `}
          >
            {sidebar}
          </div>
        </div>

        {/* Collapse Toggle - Desktop Only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-6 h-6 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-colors shrink-0 border-l border-white/8"
          title={collapsed ? "Expandir" : "Recolher"}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>
    </div>
  );
}
