"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, PictureInPicture2,
} from "lucide-react";

interface DirectSource {
  type: "direct";
  src: string;
  poster?: string;
}

interface YoutubeSource {
  type: "youtube";
  youtubeId: string;
}

interface VimeoSource {
  type: "vimeo";
  vimeoId: string;
}

interface LiveKitSource {
  type: "livekit";
  videoTrack?: React.ReactNode;
  screenTrack?: React.ReactNode;
}

type VideoSource = DirectSource | YoutubeSource | VimeoSource | LiveKitSource;

interface VideoPlayerProps {
  source: VideoSource;
  className?: string;
  onProgress?: (currentTime: number, duration: number) => void;
}

export function VideoPlayer({ source, className = "", onProgress }: VideoPlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [videoSize, setVideoSize] = useState<{ width: number; height: number } | null>(null);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    return () => clearTimeout(hideTimer.current);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setFullscreen(false);
    } else {
      await containerRef.current.requestFullscreen();
      setFullscreen(true);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleAspectRatio = useCallback((width: number, height: number) => {
    setVideoSize({ width, height });
  }, []);

  // Compute container size like YouTube: respect video ratio + cap max height
  const getContainerStyle = (): React.CSSProperties => {
    if (!videoSize || fullscreen) return {};

    const parentWidth = wrapperRef.current?.clientWidth ?? 0;
    if (parentWidth <= 0) return {};

    const { width: vw, height: vh } = videoSize;
    const videoRatio = vw / vh;
    const maxHeight = typeof window !== "undefined" ? window.innerHeight * 0.75 : 600;

    // Start with parent width
    let containerWidth = parentWidth;
    let containerHeight = parentWidth / videoRatio;

    // If height exceeds max, cap it and recalculate width
    if (containerHeight > maxHeight) {
      containerHeight = maxHeight;
      containerWidth = maxHeight * videoRatio;
    }

    return {
      width: containerWidth,
      maxWidth: "100%",
      height: containerHeight,
      margin: "0 auto",
    };
  };

  return (
    <div ref={wrapperRef} className={`w-full bg-black ${fullscreen ? "fixed inset-0 z-50" : ""} ${className}`}>
      <div
        ref={containerRef}
        className={`relative bg-black overflow-hidden group ${fullscreen ? "w-full h-full" : ""}`}
        style={getContainerStyle()}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
      >
        {source.type === "direct" && (
          <DirectPlayer source={source} showControls={showControls} onFullscreen={toggleFullscreen} fullscreen={fullscreen} onProgress={onProgress} onAspectRatio={handleAspectRatio} />
        )}
        {(source.type === "youtube" || source.type === "vimeo") && (
          <EmbedPlayer source={source} showControls={showControls} onFullscreen={toggleFullscreen} fullscreen={fullscreen} />
        )}
        {source.type === "livekit" && (
          <LiveKitPlayer source={source} showControls={showControls} onFullscreen={toggleFullscreen} fullscreen={fullscreen} />
        )}

        {/* Fullscreen button (floating, always visible on hover) */}
        <button
          onClick={toggleFullscreen}
          className={`absolute top-3 right-3 z-20 p-2 bg-black/60 text-white hover:bg-black/80 transition-opacity ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Direct (HTML5 Video) Player ──────────────────────────────
function DirectPlayer({
  source,
  showControls,
  onFullscreen,
  fullscreen,
  onProgress,
  onAspectRatio,
}: {
  source: DirectSource;
  showControls: boolean;
  onFullscreen: () => void;
  fullscreen: boolean;
  onProgress?: (currentTime: number, duration: number) => void;
  onAspectRatio?: (width: number, height: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [pinned, setPinned] = useState(false);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTime = () => { setCurrentTime(v.currentTime); const d = v.duration || 0; setDuration(d); onProgress?.(v.currentTime, d); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onVol = () => { setVolume(v.volume); setMuted(v.muted); };
    const onRate = () => setPlaybackRate(v.playbackRate);
    const onBuffer = () => {
      if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
    };
    const onLoadedMetadata = () => {
      onTime();
      if (v.videoWidth > 0 && v.videoHeight > 0) {
        onAspectRatio?.(v.videoWidth, v.videoHeight);
      }
    };

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("volumechange", onVol);
    v.addEventListener("ratechange", onRate);
    v.addEventListener("progress", onBuffer);
    v.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("volumechange", onVol);
      v.removeEventListener("ratechange", onRate);
      v.removeEventListener("progress", onBuffer);
      v.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const t = Number(e.target.value);
    v.currentTime = t;
    setCurrentTime(t);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = Number(e.target.value);
    v.volume = val;
    setVolume(val);
    if (val === 0) v.muted = true;
    else v.muted = false;
    setMuted(v.muted);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const changeSpeed = (speed: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setPinned(false);
      } else {
        await v.requestPictureInPicture();
        setPinned(true);
      }
    } catch { /* not supported */ }
  };

  useEffect(() => {
    const onPiP = () => setPinned(!!document.pictureInPictureElement);
    document.addEventListener("enterpictureinpicture", onPiP);
    document.addEventListener("leavepictureinpicture", onPiP);
    return () => {
      document.removeEventListener("enterpictureinpicture", onPiP);
      document.removeEventListener("leavepictureinpicture", onPiP);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case " ":
        case "k": e.preventDefault(); togglePlay(); break;
        case "f": e.preventDefault(); onFullscreen(); break;
        case "m": e.preventDefault(); toggleMute(); break;
        case "ArrowLeft": {
          const v = videoRef.current;
          if (v) { v.currentTime = Math.max(0, v.currentTime - 5); }
          break;
        }
        case "ArrowRight": {
          const v = videoRef.current;
          if (v) { v.currentTime = Math.min(v.duration || 0, v.currentTime + 5); }
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "00:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="relative flex-1" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={source.src}
          poster={source.poster}
          className="w-full h-full object-contain"
          style={{ pointerEvents: "none" }}
          playsInline
          preload="metadata"
        />
      </div>

      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30 cursor-pointer"
        >
          <div className="flex h-16 w-16 items-center justify-center bg-blue-600/90 shadow-lg shadow-blue-500/30 transition-transform hover:scale-105">
            <Play className="h-8 w-8 text-white ml-1" />
          </div>
        </button>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-3 px-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative w-full h-1 bg-gray-600/50 mb-3 group/progress cursor-pointer">
          <div className="absolute top-0 left-0 h-full bg-gray-500/40" style={{ width: `${bufPct}%` }} />
          <div className="absolute top-0 left-0 h-full bg-blue-500" style={{ width: `${pct}%` }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${pct}% - 7px)` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={seek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            aria-label="Procurar"
          />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
            {playing ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
          </button>

          <span className="text-xs text-gray-300 font-mono tabular-nums whitespace-nowrap">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          <div className="flex items-center gap-1.5 group/vol">
            <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors">
              {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div className="relative w-0 group-hover/vol:w-20 transition-all duration-200 overflow-hidden">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={changeVolume}
                className="w-20 h-1 accent-blue-500 cursor-pointer"
                aria-label="Volume"
              />
            </div>
          </div>

          <div className="flex-1" />

          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1 text-xs text-gray-300 hover:text-white transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>{playbackRate}x</span>
            </button>
            {showSpeedMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSpeedMenu(false)} />
                <div className="absolute bottom-8 right-0 z-50 bg-gray-900 border border-gray-700 py-1 min-w-[100px]">
                  {speeds.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                        playbackRate === s ? "text-blue-400 bg-blue-500/10" : "text-gray-300 hover:bg-gray-800"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={togglePiP}
            className={`transition-colors ${pinned ? "text-blue-400" : "text-gray-300 hover:text-white"}`}
            title="Picture-in-Picture"
          >
            <PictureInPicture2 className="h-4 w-4" />
          </button>

          <button onClick={onFullscreen} className="text-gray-300 hover:text-white transition-colors">
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Embedded (YouTube / Vimeo) Player ───────────────────────
function EmbedPlayer({
  source,
  showControls,
}: {
  source: YoutubeSource | VimeoSource;
  showControls: boolean;
  onFullscreen: () => void;
  fullscreen: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  let embedUrl = "";
  if (source.type === "youtube") {
    const u = new URL(`https://www.youtube.com/embed/${source.youtubeId}`);
    u.searchParams.set("rel", "0");
    u.searchParams.set("modestbranding", "1");
    u.searchParams.set("playsinline", "1");
    u.searchParams.set("controls", "1");
    embedUrl = u.toString();
  } else {
    embedUrl = `https://player.vimeo.com/video/${source.vimeoId}?title=0&byline=0&portrait=0&badge=0`;
  }

  return (
    <iframe
      ref={iframeRef}
      src={embedUrl}
      className="w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      title="Video player"
    />
  );
}

// ── LiveKit Player ───────────────────────────────────────────
function LiveKitPlayer({
  source,
  showControls,
  onFullscreen,
  fullscreen,
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
            <div className="absolute bottom-16 right-4 w-44 h-32 shadow-2xl border-2 border-purple-600/50 overflow-hidden">
              {source.videoTrack}
            </div>
          )}
        </>
      ) : source.videoTrack ? (
        <div className="w-full h-full">
          {source.videoTrack}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-700">
          <div className="text-lg font-medium text-gray-500">A aguardar transmissão...</div>
        </div>
      )}
    </div>
  );
}
