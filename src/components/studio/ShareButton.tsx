"use client";

import { useState } from "react";
import { Loader2, Share2, Copy, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";

interface Props {
  liveId: string;
  liveTitle: string;
}

export function ShareButton({ liveId, liveTitle }: Props) {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/access/private-link/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ liveId, expiresIn: 24 * 60 * 60 * 1000 }),
      });
      const data = await res.json();
      if (data.shareUrl) setShareUrl(data.shareUrl);
      else logger.error("ShareButton: no shareUrl in response", null, { data });
    } catch (err) {
      logger.error("ShareButton: generate failed", err, { liveId });
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Aula ao Vivo: ${liveTitle}`, text: "Clica para aceder à aula", url: shareUrl });
      } catch (err) {
        logger.error("ShareButton: native share failed", err);
      }
    } else {
      copy();
    }
  };

  const handleClick = async () => {
    if (!shareUrl && !loading) {
      await generate();
      setShowMenu(true);
    } else {
      setShowMenu(v => !v);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        title="Partilhar aula"
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple/20 hover:bg-purple/30 border border-purple/50 text-purple-200 hover:text-purple-100 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">A gerar...</span></>
          : <><Share2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Partilhar</span></>
        }
      </button>

      {showMenu && shareUrl && (
        <div className="fixed top-12 right-4 bg-[#111114] border border-gray-700 shadow-xl p-3 space-y-2 z-50 w-64">
          <div className="bg-gray-900 p-2 flex gap-2 items-center">
            <input
              type="text" value={shareUrl} readOnly
              className="flex-1 bg-transparent text-gray-200 text-sm font-mono border-0 outline-0 truncate"
            />
            <button
              onClick={copy}
              className={`p-1 shrink-0 transition-colors ${copied ? "bg-green-500/20 text-green-400" : "bg-gray-700 hover:bg-gray-600 text-gray-300"}`}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
          <div className="flex gap-2 text-sm">
            <button onClick={copy} className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1 transition-colors">
              <Copy className="h-3 w-3" /> Copiar
            </button>
            <button onClick={share} className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 transition-colors">
              <Share2 className="h-3 w-3" /> Enviar
            </button>
          </div>
          <p className="text-[13px] text-gray-500 text-center">Link válido 24h · ilimitado de usos</p>
          <button onClick={() => setShowMenu(false)} className="w-full text-[13px] text-gray-600 hover:text-gray-400 transition-colors pt-1">
            Fechar
          </button>
        </div>
      )}
    </>
  );
}
