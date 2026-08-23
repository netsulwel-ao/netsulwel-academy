"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
  X, Smartphone, Loader2, CheckCircle2, Copy, Check,
  Wifi, WifiOff, Video, Mic, RefreshCw,
} from "lucide-react";
import type { User } from "firebase/auth";

interface RemoteDeviceModalProps {
  liveId: string;
  user: User;
  onClose: () => void;
  /** Called when host wants to use the remote device as video source */
  onUseAsCamera: (sessionId: string, trackName: string) => void;
  /** Called when host wants to use the remote device as audio source */
  onUseAsMic: (sessionId: string, trackName: string) => void;
}

type ModalStatus = "generating" | "waiting" | "connected" | "error";

export function RemoteDeviceModal({
  liveId,
  user,
  onClose,
  onUseAsCamera,
  onUseAsMic,
}: RemoteDeviceModalProps) {
  const [status, setStatus] = useState<ModalStatus>("generating");
  const [token, setToken] = useState<string | null>(null);
  const [deviceUrl, setDeviceUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [remoteDevice, setRemoteDevice] = useState<any>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const generateToken = useCallback(async () => {
    setStatus("generating");
    setToken(null);
    setDeviceUrl(null);
    setQrDataUrl(null);
    setRemoteDevice(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/remote-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ action: "create", liveId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const url = `${window.location.origin}/studio/remote/${data.token}`;
      setToken(data.token);
      setDeviceUrl(url);
      setExpiresAt(data.expiresAt);
      setTimeLeft(Math.floor((data.expiresAt - Date.now()) / 1000));

      // Generate QR code using a free API (no library needed)
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=111827&color=ffffff&margin=10`;
      setQrDataUrl(qr);

      setStatus("waiting");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Erro ao gerar link.");
    }
  }, [liveId, user]);

  // ── Watch Firestore for device connection ─────────────────
  useEffect(() => {
    if (!token) return;
    if (unsubRef.current) unsubRef.current();

    const unsub = onSnapshot(
      doc(db, "lives", liveId, "remoteDevices", token),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setRemoteDevice(data);
        if (data.status === "live" || data.status === "connected") {
          setStatus("connected");
        }
      }
    );
    unsubRef.current = unsub;
    return () => unsub();
  }, [token, liveId]);

  // ── Countdown timer ───────────────────────────────────────
  useEffect(() => {
    if (!expiresAt) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (status === "waiting") setStatus("error"), setErrorMsg("Link expirado. Gera um novo.");
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [expiresAt, status]);

  // ── Generate on mount ─────────────────────────────────────
  useEffect(() => {
    generateToken();
    return () => {
      if (unsubRef.current) unsubRef.current();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Copy link ─────────────────────────────────────────────
  const copyLink = useCallback(() => {
    if (!deviceUrl) return;
    navigator.clipboard.writeText(deviceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [deviceUrl]);

  // ── Revoke device ─────────────────────────────────────────
  const revokeDevice = useCallback(async () => {
    if (!token) return;
    try {
      const idToken = await user.getIdToken();
      await fetch(`/api/remote-device?liveId=${liveId}&token=${token}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
    } catch {}
    onClose();
  }, [token, liveId, user, onClose]);

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-gray-900 border border-gray-800 w-full sm:max-w-md shadow-2xl sm:rounded-none max-h-[90dvh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center gap-2.5">
            <Smartphone className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Usar telemóvel como câmara</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Generating */}
          {status === "generating" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
              <p className="text-gray-400 text-sm">A gerar link...</p>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500 px-4 py-3">
                <WifiOff className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{errorMsg}</p>
              </div>
              <button
                onClick={generateToken}
                className="w-full py-2.5 bg-gray-800 text-white text-sm hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Gerar novo link
              </button>
            </div>
          )}

          {/* Waiting for device */}
          {(status === "waiting") && deviceUrl && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Abre este link no telemóvel para o ligar como câmara ou microfone.
              </p>

              {/* QR Code */}
              <div className="flex justify-center">
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-44 h-44 border border-gray-700"
                  />
                )}
              </div>

              {/* URL + copy */}
              <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-3 py-2">
                <p className="text-xs text-gray-400 font-mono truncate flex-1 min-w-0">
                  {deviceUrl}
                </p>
                <button
                  onClick={copyLink}
                  className="shrink-0 p-1 text-gray-500 hover:text-white transition-colors"
                  title="Copiar link"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <span>Link expira em</span>
                <span className={`font-mono font-bold ${timeLeft < 60 ? "text-red-400" : "text-gray-300"}`}>
                  {fmtTime(timeLeft)}
                </span>
              </div>

              {/* Waiting indicator */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                À espera que o telemóvel se ligue...
              </div>
            </div>
          )}

          {/* Connected */}
          {status === "connected" && remoteDevice && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-300">Telemóvel ligado!</p>
                  <p className="text-xs text-green-400 mt-0.5">
                    {remoteDevice.facingMode === "environment" ? "Câmara traseira" : "Câmara frontal"} · A transmitir
                  </p>
                </div>
                <Wifi className="h-4 w-4 text-green-400 ml-auto" />
              </div>

              <p className="text-gray-400 text-sm">
                Escolhe como queres usar este dispositivo na live:
              </p>

              {/* Use as camera */}
              {remoteDevice.videoTrackName && (
                <button
                  onClick={() => {
                    onUseAsCamera(remoteDevice.sessionId, remoteDevice.videoTrackName);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 px-4 py-3 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                    <Video className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Usar como câmara</p>
                    <p className="text-xs text-gray-500 mt-0.5">Substitui o vídeo da live pelo vídeo do telemóvel</p>
                  </div>
                </button>
              )}

              {/* Use as mic */}
              {remoteDevice.audioTrackName && (
                <button
                  onClick={() => {
                    onUseAsMic(remoteDevice.sessionId, remoteDevice.audioTrackName);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 px-4 py-3 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-full bg-green-600/20 flex items-center justify-center shrink-0">
                    <Mic className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Usar como microfone</p>
                    <p className="text-xs text-gray-500 mt-0.5">Substitui o áudio da live pelo microfone do telemóvel</p>
                  </div>
                </button>
              )}

              {/* Disconnect */}
              <button
                onClick={revokeDevice}
                className="w-full py-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Desligar dispositivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
