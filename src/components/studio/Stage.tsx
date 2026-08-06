"use client";

import { VideoTrack, AudioTrack, useTracks, useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { VideoOff } from "lucide-react";

export function Stage({ hostName }: { hostName: string }) {
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare, Track.Source.Microphone],
    { onlySubscribed: false }
  );
  const { localParticipant } = useLocalParticipant();

  const screenTrack = tracks.find(
    t => t.source === Track.Source.ScreenShare && t.participant.identity === localParticipant.identity
  );
  const cameraTrack = tracks.find(
    t => t.source === Track.Source.Camera && t.participant.identity === localParticipant.identity
  );
  const audioTracks = tracks.filter(
    t => t.source === Track.Source.Microphone && t.participant.identity !== localParticipant?.identity
  );

  return (
    <div className="relative w-full h-full bg-[#0a0a0c] flex items-center justify-center">
      {/* Remote audio */}
      {audioTracks.map(track => (
        <AudioTrack key={track.participant.identity} trackRef={track} />
      ))}

      {/* Video */}
      {screenTrack
        ? <VideoTrack trackRef={screenTrack} className="w-full h-full object-contain" />
        : cameraTrack
        ? <VideoTrack trackRef={cameraTrack} className="w-[85%] h-[85%] object-cover" />
        : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <VideoOff className="h-12 w-12 text-white/10" />
            <span className="text-sm text-white/20">Câmara desligada</span>
          </div>
        )
      }

      {/* Nameplate */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <span className="text-sm font-semibold text-white drop-shadow-sm">{hostName}</span>
        <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Professor</span>
      </div>
    </div>
  );
}
