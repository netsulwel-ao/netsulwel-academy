"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download, ChevronDown } from "lucide-react";
import type { LiveSession } from "@/types/live";

interface ReplayPlayerProps {
  live: LiveSession;
  isStudent: boolean;
}

/**
 * Replay Player component
 * Shows video player for recorded sessions
 * Displays in both professor and student views
 */
export function ReplayPlayer({ live, isStudent }: ReplayPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if recording is available
  if (live.recordingStatus !== "ready" || !live.recordingUrl) {
    return null;
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDownload = async () => {
    if (!live.recordingUrl) return;

    try {
      const response = await fetch(live.recordingUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${live.title}_${live.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="bg-[#1a1a1e] border border-white rounded-lg overflow-hidden">
      {/* Collapsed view */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-white transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded flex items-center justify-center">
              <Play size={20} className="text-white fill-white" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-white">Gravação Disponível</h3>
              <p className="text-sm text-white">
                {formatTime(duration)}
              </p>
            </div>
          </div>
          <ChevronDown size={20} className="text-white" />
        </button>
      )}

      {/* Expanded view */}
      {isExpanded && (
        <div className="space-y-3 p-4">
          {/* Video player */}
          <div className="bg-black rounded overflow-hidden">
            <video
              ref={videoRef}
              src={live.recordingUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              className="w-full bg-black"
            />
          </div>

          {/* Player controls */}
          <div className="space-y-2">
            {/* Play/Pause button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="p-2 hover:bg-white rounded transition-colors"
                title={isPlaying ? "Pausar" : "Reproduzir"}
              >
                {isPlaying ? (
                  <Pause size={20} className="text-white" />
                ) : (
                  <Play size={20} className="text-white fill-white" />
                )}
              </button>

              {/* Timeline/progress bar */}
              <div className="flex-1 flex items-center gap-2 px-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-white rounded cursor-pointer appearance-none"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${
                      duration ? (currentTime / duration) * 100 : 0
                    }%, rgb(255, 255, 255, 0.1) ${
                      duration ? (currentTime / duration) * 100 : 0
                    }%, rgb(255, 255, 255, 0.1) 100%)`,
                  }}
                />
              </div>

              {/* Time display */}
              <span className="text-sm text-white min-w-fit">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded flex items-center justify-center gap-2 transition-colors"
            >
              <Download size={16} />
              Descarregar Gravação
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full py-2 text-white hover:text-white text-sm font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
