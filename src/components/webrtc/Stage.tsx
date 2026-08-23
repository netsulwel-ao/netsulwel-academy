"use client";

import { VideoElement } from "./VideoElement";


interface StageProps {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isScreenSharing: boolean;
}

export function Stage({ localStream, screenStream, isScreenSharing }: StageProps) {
  return (
    <div className="flex-1 bg-gray-950 relative">
      {isScreenSharing && screenStream ? (
        <>
          {/* Screen share full screen */}
          <VideoElement stream={screenStream} className="h-full w-full" />
          {/* Camera pip */}
          {localStream && (
            <div className="absolute bottom-4 right-4 w-48 h-36 border-2 border-gray-700 overflow-hidden">
              <VideoElement stream={localStream} muted className="h-full w-full" />
            </div>
          )}
        </>
      ) : localStream ? (
        <VideoElement stream={localStream} muted className="h-full w-full" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-500">📡</span>
            </div>
            <p className="text-gray-500">A preparar câmara...</p>
          </div>
        </div>
      )}
    </div>
  );
}
