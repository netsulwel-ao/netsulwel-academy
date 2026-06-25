"use client";

import { useDashboardTheme } from "@/hooks/useDashboardTheme";
import ChatList from "@/components/chat/ChatList";

export default function ChatsPage() {
  const theme = useDashboardTheme();

  return (
    <div className={theme === "light" ? "text-gray-900" : "text-gray-100"}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
        <p className={`text-sm mt-1 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
          Conversas de grupo e mensagens individuais dos teus cursos
        </p>
      </div>

      <div className={`border ${theme === "light" ? "border-gray-200 bg-white" : "border-gray-800 bg-gray-950/40"}`}>
        <ChatList theme={theme} />
      </div>
    </div>
  );
}
