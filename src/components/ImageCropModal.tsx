"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import { SlidersHorizontal, ZoomIn, Loader2, X, AlertCircle } from "lucide-react";

interface ImageCropModalProps {
  imageUrl: string;
  title: string;
  aspectRatio: number;
  outputWidth: number;
  outputHeight: number;
  onCancel: () => void;
  onConfirm: (croppedBlob: Blob) => Promise<void>;
}

export function ImageCropModal({ imageUrl, title, aspectRatio, outputWidth, outputHeight, onCancel, onConfirm }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const savingRef = useRef(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Safety timeout — se saving ficar true >15s, reset
  useEffect(() => {
    if (!saving) return;
    const t = setTimeout(() => {
      setSaving(false);
      setModalError("Tempo excedido. Tenta novamente.");
    }, 15000);
    return () => clearTimeout(t);
  }, [saving]);

  const createBlob = async (): Promise<Blob> => {
    const img = document.createElement("img");
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout a carregar imagem")), 15000);
      img.onload = () => { clearTimeout(timeout); resolve(); };
      img.onerror = () => { clearTimeout(timeout); reject(new Error("Falha ao carregar imagem")); };
      img.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Sem contexto de canvas");
    const { width, height, x, y } = croppedAreaPixels!;
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    ctx.drawImage(img, x, y, width, height, 0, 0, outputWidth, outputHeight);

    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) { resolve(b); return; }
        canvas.toBlob((b2) => {
          if (b2) { resolve(b2); return; }
          reject(new Error("canvas.toBlob devolveu null"));
        }, "image/png");
      }, "image/webp", 0.9);
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setModalError("");
    try {
      const blob = await createBlob();
      await onConfirm(blob);
    } catch (err) {
      console.error("ImageCropModal error:", err);
      setModalError(err instanceof Error ? err.message : "Erro desconhecido");
      setSaving(false);
      savingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-labelledby="crop-title"
      onKeyDown={(e) => { if (e.key === "Escape" && !saving) onCancel(); }}>
      <div className="bg-gray-950 border border-gray-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <h2 id="crop-title" className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onCancel} aria-label="Cancelar corte" className="text-gray-500 hover:text-white transition-colors" disabled={saving}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative flex-1 min-h-[300px] bg-gray-900">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Error */}
        {modalError && (
          <div className="flex items-center gap-2 bg-red-500/10 border-y border-red-500/20 px-6 py-3 text-sm text-red-400 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0" />{modalError}
          </div>
        )}

        {/* Controls */}
        <div className="px-6 py-4 shrink-0">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <ZoomIn className="h-4 w-4 text-gray-500 shrink-0" />
            <input type="range" min={1} max={3} step={0.01} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-purple h-1.5 appearance-none bg-gray-700 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple [&::-webkit-slider-thumb]:cursor-pointer" />
            <span className="text-xs text-gray-500 w-8 text-right">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800 shrink-0">
          <button onClick={onCancel} disabled={saving}
            className="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-purple hover:bg-purple-light disabled:opacity-50 text-white px-6 py-2.5 text-sm font-bold transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SlidersHorizontal className="h-4 w-4" />}
            {saving ? "A guardar..." : "Concluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
