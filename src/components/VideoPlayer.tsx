"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, Settings, PictureInPicture2, Loader2,
} from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────

interface DirectSource  { type: "direct";   src: string; poster?: string; }
interface YoutubeSource { type: "youtube";  youtubeId: string; }
interface VimeoSource   { type: "vimeo";    vimeoId: string; }
interface LiveKitSource { type: "livekit";  videoTrack?: React.ReactNode; screenTrack?: React.ReactNode; }

type VideoSource = DirectSource | YoutubeSource | VimeoSource | LiveKitSource;

interface VideoPlayerProps {
  source: VideoSource;
  className?: string;
  onProgress?: (currentTime: number, duration: number) => void;
}

// ── Helper: formatar tempo ────────────────────────────────────
function fmt(s: number): string {
  if (!s || !isFinite(s)) return "0:00";
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// ── VideoPlayer (wrapper) ─────────────────────────────────────
export function VideoPlayer({ source, className = "", onProgress }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Mostrar controlos e agendar escondimento
  const revealControls = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000) as unknown as ReturnType<typeof setTimeout>;
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // Fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black overflow-hidden ${
        fullscreen ? "fixed inset-0 z-50" : "aspect-video"
      } ${className}`}
      onMouseMove={revealControls}
      onMouseLeave={() => {
        clearTimeout(hideTimer.current);
        setShowControls(false);
      }}
      onTouchStart={revealControls}
    >
      {source.type === "direct" && (
        <DirectPlayer
          source={source}
          showControls={showControls}
          onFullscreen={toggleFullscreen}
          fullscreen={fullscreen}
          onProgress={onProgress}
          onRevealControls={revealControls}
        />
      )}
      {(source.type === "youtube" || source.type === "vimeo") && (
        <EmbedPlayer source={source} />
      )}
      {source.type === "livekit" && (
        <LiveKitPlayer
          source={source}
          showControls={showControls}
          onFullscreen={toggleFullscreen}
          fullscreen={fullscreen}
        />
      )}
    </div>
  );
}

// ── DirectPlayer ──────────────────────────────────────────────
function DirectPlayer({
  source, showControls, onFullscreen, fullscreen, onProgress, onRevealControls,
}: {
  source: DirectSource;
  showControls: boolean;
  onFullscreen: () => void;
  fullscreen: boolean;
  onProgress?: (t: number, d: number) => void;
  onRevealControls: () => void;
}) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const progressRef     = useRef<HTMLDivElement>(null);

  const [playing, setPlaying]           = useState(false);
  const [loading, setLoading]           = useState(true);
  const [currentTime, setCurrentTime]   = useState(0);
  const [duration, setDuration]         = useState(0);
  const [volume, setVolume]             = useState(1);
  const [muted, setMuted]               = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [buffered, setBuffered]         = useState(0);
  const [pip, setPip]                   = useState(false);

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // ── Eventos do vídeo ────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handlers = {
      timeupdate:      () => { setCurrentTime(v.currentTime); setDuration(v.duration || 0); onProgress?.(v.currentTime, v.duration || 0); },
      play:            () => setPlaying(true),
      pause:           () => setPlaying(false),
      volumechange:    () => { setVolume(v.volume); setMuted(v.muted); },
      ratechange:      () => setPlaybackRate(v.playbackRate),
      progress:        () => { if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1)); },
      waiting:         () => setLoading(true),
      playing:         () => setLoading(false),
      canplay:         () => setLoading(false),
      loadedmetadata:  () => { setDuration(v.duration || 0); setLoading(false); },
    };

    Object.entries(handlers).forEach(([e, h]) => v.addEventListener(e, h));
    return () => Object.entries(handlers).forEach(([e, h]) => v.removeEventListener(e, h));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PiP listeners ───────────────────────────────────────────
  useEffect(() => {
    const h = () => setPip(!!document.pictureInPictureElement);
    document.addEventListener("enterpictureinpicture", h);
    document.addEventListener("leavepictureinpicture", h);
    return () => { document.removeEventListener("enterpictureinpicture", h); document.removeEventListener("leavepictureinpicture", h); };
  }, []);

  // ── Atalhos de teclado ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const v = videoRef.current;
      if (!v) return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); v.paused ? v.play() : v.pause(); break;
        case "f": e.preventDefault(); onFullscreen(); break;
        case "m": e.preventDefault(); v.muted = !v.muted; break;
        case "ArrowLeft": e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 5); break;
        case "ArrowRight": e.preventDefault(); v.currentTime = Math.min(v.duration || 0, v.currentTime + 5); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onFullscreen]);

  // ── Double-tap para seek (mobile) ───────────────────────────
  const lastTap = useRef(0);
  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const isDoubleTap = now - lastTap.current < 300;
    lastTap.current = now;
    if (isDoubleTap) {
      const v = videoRef.current;
      if (!v) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 2) {
        v.currentTime = Math.max(0, v.currentTime - 10);
      } else {
        v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
      }
      onRevealControls();
    } else {
      const v = videoRef.current;
      if (!v) return;
      v.paused ? v.play() : v.pause();
    }
  }, [onRevealControls]);

  // ── Seek por clique na barra ────────────────────────────────
  const handleSeekClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * (v.duration || 0);
  }, []);

  const pct    = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered  / duration) * 100 : 0;

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Vídeo */}
      <div className="relative flex-1" onClick={handleTap}>
        <video
          ref={videoRef}
          src={source.src}
          poster={source.poster}
          className="w-full h-full object-contain"
          style={{ pointerEvents: "none" }}
          playsInline
          preload="metadata"
        />

        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {/* Play central quando pausado */}
        {!playing && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex h-14 w-14 items-center justify-center bg-black border border-white">
              <Play className="h-7 w-7 text-white ml-0.5" strokeWidth={1.5} />
            </div>
          </div>
        )}
      </div>

      {/* ── Controlos ── */}
      <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-200 ${
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        {/* Gradiente de fundo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        <div className="relative px-3 pb-3 sm:px-4 sm:pb-4 pt-10">
          {/* Barra de progresso — maior área de toque em mobile */}
          <div
            ref={progressRef}
            onClick={handleSeekClick}
            className="relative w-full mb-3 cursor-pointer group/prog"
            style={{ height: 20, display: "flex", alignItems: "center" }}
          >
            {/* Track */}
            <div className="relative w-full h-1 sm:h-1.5 bg-white group-hover/prog:h-2 transition-all duration-150">
              {/* Buffered */}
              <div className="absolute top-0 left-0 h-full bg-white transition-all" style={{ width: `${bufPct}%` }} />
              {/* Progress */}
              <div className="absolute top-0 left-0 h-full bg-purple" style={{ width: `${pct}%` }} />
              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-purple border-2 border-white opacity-0 group-hover/prog:opacity-100 transition-opacity"
                style={{ left: `calc(${pct}% - 6px)` }}
              />
            </div>
            {/* Input invisible overlay para acessibilidade */}
            <input
              type="range" min={0} max={duration || 100} value={currentTime}
              onChange={e => { const v = videoRef.current; if (v) { v.currentTime = Number(e.target.value); setCurrentTime(Number(e.target.value)); } }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              aria-label="Posição do vídeo"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play/Pause */}
            <button
              onClick={() => { const v = videoRef.current; v?.paused ? v.play() : v?.pause(); }}
              aria-label={playing ? "Pausar" : "Reproduzir"}
              className="flex h-9 w-9 items-center justify-center text-white hover:text-purple/80 transition-colors shrink-0"
            >
              {playing
                ? <Pause className="h-5 w-5 fill-white" />
                : <Play className="h-5 w-5 fill-white ml-0.5" />
              }
            </button>

            {/* Tempo */}
            <span className="font-mono text-[13px] text-white tabular-nums whitespace-nowrap select-none">
              {fmt(currentTime)} / {fmt(duration)}
            </span>

            {/* Volume — hidden em mobile, visible em sm+ */}
            <div className="hidden sm:flex items-center gap-1 group/vol">
              <button
                onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; } }}
                aria-label={muted || volume === 0 ? "Activar som" : "Silenciar"}
                className="flex h-8 w-8 items-center justify-center text-white hover:text-white transition-colors"
              >
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <div className="w-0 group-hover/vol:w-16 overflow-hidden transition-all duration-200">
                <input
                  type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                  onChange={e => { const v = videoRef.current; if (v) { const val = Number(e.target.value); v.volume = val; v.muted = val === 0; } }}
                  className="w-16 h-1 accent-purple cursor-pointer"
                  aria-label="Volume"
                />
              </div>
            </div>

            <div className="flex-1" />

            {/* Velocidade */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowSpeedMenu(v => !v)}
                className="flex items-center gap-1 font-mono text-[13px] text-white hover:text-white transition-colors h-8 px-1"
                aria-label="Velocidade"
              >
                <Settings className="h-3.5 w-3.5" />
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSpeedMenu(false)} />
                  <div className="absolute bottom-9 right-0 z-50 border border-gray-700 bg-gray-900 py-1 min-w-[80px]">
                    {SPEEDS.map(s => (
                      <button key={s} onClick={() => { const v = videoRef.current; if (v) v.playbackRate = s; setPlaybackRate(s); setShowSpeedMenu(false); }}
                        className={`w-full px-3 py-1.5 font-mono text-[13px] text-left transition-colors ${
                          playbackRate === s ? "text-purple bg-purple/10" : "text-gray-300 hover:bg-gray-800"
                        }`}>
                        {s}x
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* PiP */}
            <button
              onClick={async () => { const v = videoRef.current; if (!v) return; try { document.pictureInPictureElement ? await document.exitPictureInPicture() : await v.requestPictureInPicture(); } catch {} }}
              aria-label={pip ? "Sair de imagem em imagem" : "Imagem em imagem"}
              className={`hidden sm:flex h-8 w-8 items-center justify-center transition-colors ${pip ? "text-purple" : "text-white hover:text-white"}`}
            >
              <PictureInPicture2 className="h-4 w-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={onFullscreen}
              aria-label={fullscreen ? "Sair de ecrã inteiro" : "Ecrã inteiro"}
              className="flex h-9 w-9 items-center justify-center text-white hover:text-white transition-colors shrink-0"
            >
              {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EmbedPlayer (YouTube / Vimeo) ────────────────────────────
function EmbedPlayer({ source }: { source: YoutubeSource | VimeoSource }) {
  let embedUrl = "";
  if (source.type === "youtube") {
    const u = new URL(`https://www.youtube.com/embed/${source.youtubeId}`);
    u.searchParams.set("rel",              "0");
    u.searchParams.set("modestbranding",   "1");
    u.searchParams.set("playsinline",      "1");
    u.searchParams.set("controls",         "1");
    embedUrl = u.toString();
  } else {
    embedUrl = `https://player.vimeo.com/video/${source.vimeoId}?title=0&byline=0&portrait=0&badge=0`;
  }

  return (
    <iframe
      src={embedUrl}
      className="absolute inset-0 w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      title="Video player"
    />
  );
}

// ── LiveKitPlayer ─────────────────────────────────────────────
function LiveKitPlayer({
  source, showControls, onFullscreen, fullscreen,
}: {
  source: LiveKitSource;
  showControls: boolean;
  onFullscreen: () => void;
  fullscreen: boolean;
}) {
  return (
    <div className="relative w-full h-full">
      {source.screenTrack ? (
        <>
          {source.screenTrack}
          {source.videoTrack && (
            <div className="absolute bottom-16 right-4 w-36 sm:w-44 aspect-video border border-purple/50 overflow-hidden shadow-2xl">
              {source.videoTrack}
            </div>
          )}
        </>
      ) : source.videoTrack ? (
        <div className="w-full h-full">{source.videoTrack}</div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
            // a aguardar transmissão
          </p>
        </div>
      )}

      {/* Fullscreen button */}
      <button
        onClick={onFullscreen}
        aria-label={fullscreen ? "Sair de ecrã inteiro" : "Ecrã inteiro"}
        className={`absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center bg-black text-white hover:bg-black transition-opacity ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>
    </div>
  );
}
