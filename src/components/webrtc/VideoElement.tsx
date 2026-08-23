"use client";

import { useEffect, useRef } from "react";

interface VideoElementProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
  label?: string;
}

export function VideoElement({ stream, muted = false, className = "", label }: VideoElementProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Set stream source
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Sync muted state via DOM (React prop alone doesn't trigger browser unmute)
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
    el.defaultMuted = muted;
    if (!muted) {
      el.play().catch(() => {});
    }
  }, [muted]);

  return (
    <div className={`relative overflow-hidden bg-gray-900 ${className}`}>
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />
      {label && (
        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 text-xs text-white font-mono">
          {label}
        </div>
      )}
    </div>
  );
}
