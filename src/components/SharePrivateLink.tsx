"use client";

import { useState } from "react";
import { usePrivateAccessLink } from "@/hooks/usePrivateAccessLink";
import { Copy, Share2, Check, Loader2, Link as LinkIcon, Trash2, Clock, Users } from "lucide-react";
import { toast } from "sonner";

interface SharePrivateLinkProps {
  courseId?: string;
  liveId?: string;
  title: string;
}

export function SharePrivateLink({ courseId, liveId, title }: SharePrivateLinkProps) {
  const { createLink, revokeLink, getShareUrl, loading } = usePrivateAccessLink();
  const [showDialog, setShowDialog] = useState(false);
  const [expiresIn, setExpiresIn] = useState(7); // dias
  const [maxUses, setMaxUses] = useState(10);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!courseId && !liveId) {
      toast.error("Curso ou Live não especificado");
      return;
    }

    const expiresAtMs = expiresIn > 0 ? expiresIn * 24 * 60 * 60 * 1000 : undefined;
    const link = await createLink(courseId, liveId, expiresAtMs, maxUses > 0 ? maxUses : undefined);

    if (link) {
      const shareUrl = getShareUrl(link.token);
      setGeneratedLink(shareUrl);
      toast.success("Link criado com sucesso!");
    }
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copiado para clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!generatedLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Acesso: ${title}`,
          text: `Clica neste link para aceder ao conteúdo: ${generatedLink}`,
          url: generatedLink,
        });
      } catch (err) {
        console.error("Erro ao compartilhar:", err);
      }
    } else {
      // Fallback: copiar para clipboard
      handleCopy();
    }
  };

  return (
    <>
      {/* Botão principal */}
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-purple hover:bg-purple-light text-white font-semibold text-sm transition-colors rounded-lg"
        title="Criar link de acesso privado"
      >
        <Share2 className="h-4 w-4" />
        Gerar Link de Acesso
      </button>

      {/* Modal Dialog */}
      {showDialog && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowDialog(false)} />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-gray-700 rounded-xl max-w-md w-full shadow-2xl">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-purple" />
                  <h2 className="text-lg font-bold text-white">Link de Acesso Privado</h2>
                </div>
                <button
                  onClick={() => setShowDialog(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-4">
                {!generatedLink ? (
                  <>
                    <p className="text-sm text-gray-400">
                      Cria um link para partilhar com alunos que fizeram pagamento manual.
                    </p>

                    {/* Expires In */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Validade do Link
                      </label>
                      <select
                        value={expiresIn}
                        onChange={(e) => setExpiresIn(Number(e.target.value))}
                        className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg focus:border-purple focus:outline-none text-sm"
                      >
                        <option value={0}>Sem expiração</option>
                        <option value={1}>1 dia</option>
                        <option value={7}>7 dias</option>
                        <option value={14}>14 dias</option>
                        <option value={30}>30 dias</option>
                      </select>
                    </div>

                    {/* Max Uses */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Número Máximo de Usos
                      </label>
                      <input
                        type="number"
                        value={maxUses}
                        onChange={(e) => setMaxUses(Number(e.target.value))}
                        min={0}
                        max={999}
                        className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg focus:border-purple focus:outline-none text-sm"
                        placeholder="0 = ilimitado"
                      />
                      <p className="text-xs text-gray-500 mt-1">0 = sem limite de usos</p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-purple/10 border border-purple/30 rounded-lg p-3">
                      <p className="text-xs text-purple-200 leading-relaxed">
                        <strong>Como funciona:</strong> Alunos clicam no link → login automático → acesso concedido
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Generated Link Display */}
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
                      <p className="text-xs text-gray-400 font-medium">URL DO LINK:</p>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={generatedLink}
                          readOnly
                          className="flex-1 bg-gray-800 border border-gray-600 text-gray-200 px-3 py-2 rounded text-xs font-mono"
                        />
                        <button
                          onClick={handleCopy}
                          className={`p-2 transition-colors ${
                            copied
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                          }`}
                          title="Copiar"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Settings Display */}
                    <div className="bg-gray-900 rounded-lg p-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Validade:</span>
                        <span className="text-gray-200 font-medium">
                          {expiresIn === 0 ? "Sem expiração" : `${expiresIn} dias`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Máximo de usos:</span>
                        <span className="text-gray-200 font-medium">
                          {maxUses === 0 ? "Ilimitado" : `${maxUses} usos`}
                        </span>
                      </div>
                    </div>

                    {/* Share Info */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <p className="text-xs text-green-200 leading-relaxed">
                        ✓ Link criado com sucesso! Podes agora compartilhar com os teus alunos.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-700 flex gap-2">
                {!generatedLink ? (
                  <>
                    <button
                      onClick={() => setShowDialog(false)}
                      className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium text-sm rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 bg-purple hover:bg-purple-light text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Criar...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="h-4 w-4" />
                          Gerar Link
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setGeneratedLink(null);
                        setShowDialog(false);
                      }}
                      className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium text-sm rounded-lg transition-colors"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 px-4 py-2.5 bg-purple hover:bg-purple-light text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Partilhar
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
