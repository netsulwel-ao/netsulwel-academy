"use client";

import { useState } from "react";
import { useParticipants } from "@livekit/components-react";
import { Hand, Users, MessageSquare, Radio, Eye } from "lucide-react";
import type { LiveSession, ChatMessage } from "@/types/live";

import { ElapsedTimer, useEntrySound }    from "./_helpers";
import { ShareButton }                    from "./ShareButton";
import { Stage }                          from "./Stage";
import { PalavraPanel }                   from "./PalavraPanel";
import { AlunosPanel }                    from "./AlunosPanel";
import { ChatPanel }                      from "./ChatPanel";
import { ControlsBar }                    from "./ControlsBar";
import { QAPanel }                        from "@/components/QAPanel";
import { AttendanceReport }               from "@/components/AttendanceReport";
import { SimpleRecorder }                 from "@/components/SimpleRecorder";

type SideTab = "palavra" | "alunos" | "chat" | "simple-recorder" | "qa" | "attendance";

const TABS: { id: SideTab; label: string; icon: React.ReactNode }[] = [
  { id: "palavra",         label: "Palavra",   icon: <Hand        className="h-3.5 w-3.5" /> },
  { id: "alunos",          label: "Alunos",    icon: <Users       className="h-3.5 w-3.5" /> },
  { id: "chat",            label: "Chat",      icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { id: "simple-recorder", label: "Gravar",    icon: <Radio       className="h-3.5 w-3.5" /> },
  { id: "qa",              label: "Q&A",       icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { id: "attendance",      label: "Presença",  icon: <Users       className="h-3.5 w-3.5" /> },
];

interface Props {
  live:  LiveSession;
  onEnd: () => void;
}

export function StudioInterior({ live, onEnd }: Props) {
  const [tab,          setTab]          = useState<SideTab>("palavra");
  const [pinnedMsg,    setPinnedMsg]    = useState<ChatMessage | null>(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const participants = useParticipants();
  useEntrySound();

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c]">

      {/* ── Top bar ── */}
      <div className="h-11 min-h-[44px] bg-[#0e0e11] border-b border-white flex items-center px-3 sm:px-4 gap-2 sm:gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Radio className="h-3.5 w-3.5 text-white shrink-0" />
          <span className="text-sm sm:text-sm font-semibold text-white truncate">{live.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 bg-red-600/15 border border-red-500/20 px-2 py-0.5">
            <span className="w-1.5 h-1.5 bg-red-500 animate-pulse shrink-0" />
            <span className="text-[13px] font-bold text-red-400 tracking-widest">AO VIVO</span>
          </div>
          {live.startedAt && <ElapsedTimer since={live.startedAt} />}
        </div>

        <ShareButton liveId={live.id!} liveTitle={live.title} />

        <div className="flex items-center gap-1.5 text-white shrink-0">
          <Eye className="h-3.5 w-3.5" />
          <span className="text-sm tabular-nums font-medium">{participants.length}</span>
        </div>

        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          aria-label={sidebarOpen ? "Fechar barra lateral" : "Abrir barra lateral"}
          className="md:hidden flex items-center justify-center h-8 w-8 text-white hover:text-white hover:bg-white transition-colors"
        >
          <MessageSquare className={`h-4 w-4 ${sidebarOpen ? "" : "opacity-50"}`} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">

        {/* Stage */}
        <div className="flex-1 flex min-w-0 bg-black md:order-1 order-2">
          <div className="flex-1 relative w-full">
            <Stage hostName={live.hostName || "Professor"} />
          </div>
        </div>

        {/* Sidebar */}
        <div className={`
          flex flex-col bg-[#0e0e11] border-t md:border-t-0 md:border-l border-white
          w-full md:w-[280px] lg:w-[320px] shrink-0
          order-1 md:order-2
          transition-all duration-300 ease-out
          ${sidebarOpen ? "h-auto" : "h-0 overflow-hidden md:h-auto"}
        `}>
          {/* Tabs */}
          <div className="flex border-b border-white shrink-0" role="tablist" aria-label="Painel lateral">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                id={`tab-${t.id}`}
                className={`flex-1 h-10 flex items-center justify-center gap-1 sm:gap-1.5 text-sm font-semibold transition-colors ${
                  tab === t.id
                    ? "text-white border-b-2 border-white bg-white/[3%]"
                    : "text-white hover:text-white"
                }`}
              >
                <span className="text-sm sm:text-sm">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {tab === "palavra" && (
              <div role="tabpanel" id="panel-palavra" aria-labelledby="tab-palavra" className="h-full">
                <PalavraPanel liveId={live.id!} />
              </div>
            )}
            {tab === "alunos" && (
              <div role="tabpanel" id="panel-alunos" aria-labelledby="tab-alunos" className="h-full">
                <AlunosPanel liveId={live.id!} />
              </div>
            )}
            {tab === "chat" && (
              <div role="tabpanel" id="panel-chat" aria-labelledby="tab-chat" className="h-full">
                <ChatPanel liveId={live.id!} pinnedMsg={pinnedMsg} onPin={setPinnedMsg} hostName={live.hostName || "Professor"} />
              </div>
            )}
            {tab === "simple-recorder" && (
              <div role="tabpanel" id="panel-simple-recorder" aria-labelledby="tab-simple-recorder" className="h-full">
                <SimpleRecorder liveId={live.id!} liveTitle={live.title} />
              </div>
            )}
            {tab === "qa" && (
              <div role="tabpanel" id="panel-qa" aria-labelledby="tab-qa" className="h-full">
                <QAPanel liveId={live.id!} isHost={true} hostName={live.hostName || "Professor"} />
              </div>
            )}
            {tab === "attendance" && (
              <div role="tabpanel" id="panel-attendance" aria-labelledby="tab-attendance" className="h-full">
                <AttendanceReport liveId={live.id!} liveTitle={live.title} isTeacher={true} />
              </div>
            )}
          </div>
        </div>
      </div>

      <ControlsBar live={live} onEnd={onEnd} />
    </div>
  );
}
