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

  // Set stream source and re-assign whenever stream or its tracks change
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;

    // Always re-assign srcObject to pick up track changes
    el.srcObject = stream;
    el.play().catch(() => {});

    // Also listen for track additions/removals so the video stays live
    // when replaceTrack or addTrack is called on the same stream object
    const onAddTrack = () => {
      el.srcObject = stream;
      el.play().catch(() => {});
    };
    stream.addEventListener("addtrack", onAddTrack);
    stream.addEventListener("removetrack", onAddTrack);

    return () => {
      stream.removeEventListener("addtrack", onAddTrack);
      stream.removeEventListener("removetrack", onAddTrack);
    };
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
