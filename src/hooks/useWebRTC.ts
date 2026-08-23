"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import type { User } from "firebase/auth";

const CALLS_API = "/api/calls";

// ─── Helper: fetch with auth ──────────────────────────────────
async function authFetch(url: string, user: User, body: Record<string, any>) {
  const token = await user.getIdToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ─── Cloudflare Calls API (authenticated, proxied) ───────────
async function cfCreateSession(user: User, liveId: string, offer: RTCSessionDescriptionInit) {
  return authFetch(CALLS_API, user, { action: "createSession", liveId, offer });
}

async function cfPushTracks(
  user: User,
  liveId: string,
  sessionId: string,
  offer: RTCSessionDescriptionInit,
  tracks: { location: "local"; mid: string; trackName: string }[]
) {
  return authFetch(CALLS_API, user, { action: "pushTracks", liveId, sessionId, offer, tracks });
}

async function cfPullTracks(
  user: User,
  liveId: string,
  sessionId: string,
  tracks: { location: "remote"; trackName: string; sessionId: string }[]
) {
  return authFetch(CALLS_API, user, { action: "pullTracks", liveId, sessionId, tracks });
}

async function cfRenegotiate(user: User, liveId: string, sessionId: string, answer: RTCSessionDescriptionInit) {
  return authFetch(CALLS_API, user, { action: "renegotiate", liveId, sessionId, answer });
}

function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.cloudflare.com:3478" },
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
    bundlePolicy: "max-bundle",
    iceCandidatePoolSize: 10,
  });
}

function waitForConnection(pc: RTCPeerConnection, timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
      resolve();
      return;
    }
    const timeout = setTimeout(() => reject(new Error("Connection timeout")), timeoutMs);
    const handler = () => {
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        clearTimeout(timeout);
        pc.removeEventListener("iceconnectionstatechange", handler);
        resolve();
      } else if (pc.iceConnectionState === "failed") {
        clearTimeout(timeout);
        pc.removeEventListener("iceconnectionstatechange", handler);
        reject(new Error("ICE connection failed"));
      }
    };
    pc.addEventListener("iceconnectionstatechange", handler);
  });
}

// ─── Types ────────────────────────────────────────────────────
export interface DeviceIds {
  cameraId?: string;
  micId?: string;
  speakerId?: string;
}

interface UseWebRTCOptions {
  role: "host" | "viewer";
  liveId: string;
  user: User;
  deviceIds?: DeviceIds;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStreams: MediaStream[];
  sessionId: string | null;
  connected: boolean;
  error: string | null;
  join: () => Promise<void>;
  leave: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  enableSpeaker: () => Promise<void>;
  pullSpeakerTracks: (speakerSessionId: string, trackNames: string[]) => Promise<void>;
  switchDevices: (ids: DeviceIds) => Promise<void>;
  useRemoteTrack: (remoteSessionId: string, trackName: string, kind: "video" | "audio") => Promise<void>;
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isSpeaker: boolean;
}

export function useWebRTC({ role, liveId, user, deviceIds }: UseWebRTCOptions): UseWebRTCReturn {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const speakerPcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const joiningRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const deviceIdsRef = useRef<DeviceIds>(deviceIds || {});

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  // ─── HOST: Join ───────────────────────────────────────────
  const joinHost = useCallback(async () => {
    const pc = createPeerConnection();
    pcRef.current = pc;

    // 1. Set up ontrack FIRST so we never miss incoming speaker audio
    pc.ontrack = (event) => {
      const track = event.track;
      if (!track) return;
      console.log("[Host] ontrack:", track.kind, track.id);

      if (!combinedStreamRef.current) {
        combinedStreamRef.current = new MediaStream([track]);
        setRemoteStreams([combinedStreamRef.current]);
      } else if (!combinedStreamRef.current.getTracks().find((t) => t.id === track.id)) {
        combinedStreamRef.current.addTrack(track);
        setRemoteStreams([combinedStreamRef.current]);
      }
    };

    // 2. Get camera + mic
    const stream = await navigator.mediaDevices.getUserMedia({
      video: deviceIdsRef.current.cameraId
        ? { deviceId: { exact: deviceIdsRef.current.cameraId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      audio: deviceIdsRef.current.micId
        ? { deviceId: { exact: deviceIdsRef.current.micId }, echoCancellation: true, noiseSuppression: true }
        : { echoCancellation: true, noiseSuppression: true },
    });
    localStreamRef.current = stream;
    setLocalStream(stream);

    // 3. Add tracks as sendonly
    stream.getTracks().map((track) =>
      pc.addTransceiver(track, { direction: "sendonly" })
    );

    // 4. Create offer → create session (authenticated) → set answer
    await pc.setLocalDescription(await pc.createOffer());
    const sessionResult = await cfCreateSession(user, liveId, pc.localDescription!);
    setSessionId(sessionResult.sessionId);
    sessionIdRef.current = sessionResult.sessionId;
    await pc.setRemoteDescription(new RTCSessionDescription(sessionResult.sessionDescription));

    // 5. Wait for ICE
    await waitForConnection(pc);

    // 6. Push tracks
    await pc.setLocalDescription(await pc.createOffer());
    const trackObjects = pc.getTransceivers().map((t) => ({
      location: "local" as const,
      mid: t.mid!,
      trackName: t.sender.track!.id,
    }));

    const pushResult = await cfPushTracks(user, liveId, sessionResult.sessionId, pc.localDescription!, trackObjects);
    await pc.setRemoteDescription(new RTCSessionDescription(pushResult.sessionDescription));

    setConnected(true);
  }, [user, liveId]);

  // ─── HOST: Pull speaker tracks ───────────────────────────
  const pullSpeakerTracks = useCallback(async (speakerSessionId: string, trackNames: string[]) => {
    const pc = pcRef.current;
    if (!pc || !sessionIdRef.current) return;

    try {
      // Add recvonly transceiver for audio
      pc.addTransceiver("audio", { direction: "recvonly" });

      const tracksToPull = trackNames.map((trackName) => ({
        location: "remote" as const,
        trackName,
        sessionId: speakerSessionId,
      }));

      const pullResult = await cfPullTracks(user, liveId, sessionIdRef.current, tracksToPull);

      if (pullResult.requiresImmediateRenegotiation && pullResult.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(pullResult.sessionDescription));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        const renegResult = await cfRenegotiate(user, liveId, sessionIdRef.current, pc.localDescription!);
        if (renegResult.errorCode) {
          throw new Error(renegResult.errorDescription);
        }
      } else if (pullResult.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(pullResult.sessionDescription));
      }
    } catch (err) {
      console.error("[Host] Failed to pull speaker tracks:", err);
    }
  }, [user, liveId]);

  // ─── VIEWER: Join + Pull host tracks ─────────────────────
  const joinViewer = useCallback(async () => {
    const pc = createPeerConnection();
    pcRef.current = pc;

    // Add recvonly transceivers
    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });

    // Create offer → Cloudflare session → set answer
    await pc.setLocalDescription(await pc.createOffer());
    const sessionResult = await cfCreateSession(user, liveId, pc.localDescription!);
    setSessionId(sessionResult.sessionId);
    sessionIdRef.current = sessionResult.sessionId;
    await pc.setRemoteDescription(new RTCSessionDescription(sessionResult.sessionDescription));

    // Detect host disconnection via ICE
    pc.addEventListener("iceconnectionstatechange", () => {
      if (pcRef.current !== pc) return;
      const state = pc.iceConnectionState;
      console.log("[Viewer] ICE state:", state);
      if (state === "failed" || state === "disconnected" || state === "closed") {
        setConnected(false);
        combinedStreamRef.current = null;
        setRemoteStreams([]);
      }
    });

    let lastPulledHostSessionId: string | null = null;

    // Keep listener alive — reconnects automatically when host rejoins
    onSnapshot(doc(db, "lives", liveId), async (snap) => {
      // If viewer called leave(), pcRef is null — ignore
      if (pcRef.current === null) return;

      const data = snap.data();
      const hostSessionId = data?.hostSessionId as string | undefined;
      const publishedTracks = data?.publishedTracks as string[] | undefined;

      if (!hostSessionId || !publishedTracks || publishedTracks.length === 0) return;

      // Skip if already connected to this host session
      if (hostSessionId === lastPulledHostSessionId) return;
      lastPulledHostSessionId = hostSessionId;

      console.log("[Viewer] New hostSessionId detected, pulling tracks...", hostSessionId);

      try {
        // Set ontrack BEFORE pulling
        pc.ontrack = (event) => {
          if (pcRef.current !== pc) return;
          const track = event.track;
          if (!track) return;
          console.log("[Viewer] ontrack:", track.kind, track.id);

          if (!combinedStreamRef.current) {
            combinedStreamRef.current = new MediaStream([track]);
            setRemoteStreams([combinedStreamRef.current]);
          } else if (!combinedStreamRef.current.getTracks().find((t) => t.id === track.id)) {
            combinedStreamRef.current.addTrack(track);
            setRemoteStreams([combinedStreamRef.current]);
          }
          setConnected(true);
        };

        const tracksToPull = publishedTracks.map((trackName) => ({
          location: "remote" as const,
          trackName,
          sessionId: hostSessionId,
        }));

        const pullResult = await cfPullTracks(user, liveId, sessionResult.sessionId, tracksToPull);

        if (pullResult.requiresImmediateRenegotiation && pullResult.sessionDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(pullResult.sessionDescription));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          const renegResult = await cfRenegotiate(user, liveId, sessionResult.sessionId, pc.localDescription!);
          if (renegResult.errorCode) throw new Error(renegResult.errorDescription);
        } else if (pullResult.sessionDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(pullResult.sessionDescription));
        }

        console.log("[Viewer] Connected to hostSessionId:", hostSessionId);
      } catch (err) {
        console.error("[Viewer] Failed to pull host tracks:", err);
        lastPulledHostSessionId = null; // allow retry on next Firestore update
      }
    });
  }, [user, liveId]);

  // ─── JOIN ──────────────────────────────────────────────────
  const join = useCallback(async () => {
    if (joiningRef.current) return;
    joiningRef.current = true;
    try {
      setError(null);
      if (role === "host") {
        await joinHost();
      } else {
        await joinViewer();
      }
    } catch (err: any) {
      console.error("WebRTC join error:", err);
      setError(err.message || "Failed to join");
    } finally {
      joiningRef.current = false;
    }
  }, [role, joinHost, joinViewer]);

  // ─── LEAVE ──────────────────────────────────────────────────
  const leave = useCallback(() => {
    if (joiningRef.current) return;

    const sid = sessionIdRef.current;
    pcRef.current?.close();
    pcRef.current = null;
    speakerPcRef.current?.close();
    speakerPcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    sessionIdRef.current = null;
    combinedStreamRef.current = null;
    setSessionId(null);
    setConnected(false);
    setLocalStream(null);
    setRemoteStreams([]);
    setIsMicOn(false);
    setIsCameraOn(true);
    setIsScreenSharing(false);
    setIsSpeaker(false);

    if (sid) {
      user.getIdToken().then((token) => {
        fetch(`/api/signaling?liveId=${liveId}&sessionId=${sid}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }).catch(() => {});
    }
  }, [liveId, user]);

  // ─── Controls ───────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  }, []);

  // ─── Enable speaker (viewer promoted) ─────────────────────
  const enableSpeaker = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      // Get mic access first — fail fast if denied
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
      });
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error("Nenhuma faixa de áudio disponível");
      }

      // Create a dedicated PeerConnection for sending audio.
      // Reusing the viewer PC (recvonly) for sendonly causes SDP conflicts
      // with the Cloudflare Calls API.
      const speakerPc = createPeerConnection();

      // Set up ontrack BEFORE negotiating so we don't miss events
      speakerPc.ontrack = (event) => {
        const track = event.track;
        if (!track) return;
        console.log("[Speaker] ontrack:", track.kind, track.id);
      };

      // Add audio as sendonly transceiver
      speakerPc.addTransceiver(audioTrack, { direction: "sendonly" });

      // Create offer for the new speaker session
      await speakerPc.setLocalDescription(await speakerPc.createOffer());

      // Create a brand-new Cloudflare session for sending
      const sessionResult = await cfCreateSession(user, liveId, speakerPc.localDescription!);
      await speakerPc.setRemoteDescription(new RTCSessionDescription(sessionResult.sessionDescription));

      // Wait for ICE on the speaker connection
      await waitForConnection(speakerPc, 20000);

      // Push the audio track
      await speakerPc.setLocalDescription(await speakerPc.createOffer());

      const trackObjects = speakerPc.getTransceivers()
        .filter((t) => t.sender.track?.kind === "audio" && t.direction === "sendonly")
        .map((t) => ({
          location: "local" as const,
          mid: t.mid!,
          trackName: t.sender.track!.id,
        }));

      if (trackObjects.length === 0) {
        speakerPc.close();
        stream.getTracks().forEach((t) => t.stop());
        throw new Error("Nenhum transceiver de áudio encontrado");
      }

      const pushResult = await cfPushTracks(
        user,
        liveId,
        sessionResult.sessionId,
        speakerPc.localDescription!,
        trackObjects,
      );

      if (!pushResult.sessionDescription) {
        throw new Error("Push de tracks falhou: sem sessionDescription");
      }

      await speakerPc.setRemoteDescription(new RTCSessionDescription(pushResult.sessionDescription));

      // Store the new speaker sessionId so host can pull the audio
      const { setDoc: fbSetDoc, serverTimestamp: fbTs } = await import("firebase/firestore");
      await fbSetDoc(doc(db, "lives", liveId, "speakers", user.uid), {
        sessionId: sessionResult.sessionId,
        trackNames: trackObjects.map((t) => t.trackName),
        updatedAt: fbTs(),
      }, { merge: true });

      // Keep references for cleanup
      speakerPcRef.current = speakerPc;
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsSpeaker(true);
      setIsMicOn(true);

      console.log("[Speaker] Áudio ativado. SessionId:", sessionResult.sessionId);
    } catch (err: any) {
      console.error("Falha ao ativar microfone do aluno:", err);
    }
  }, [user, liveId]);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  }, []);

  // ─── Switch devices in-call (host only) ───────────────────
  const switchDevices = useCallback(async (ids: DeviceIds) => {
    const pc = pcRef.current;
    if (!pc) return;

    // Update the ref so future calls use these devices
    deviceIdsRef.current = { ...deviceIdsRef.current, ...ids };

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: ids.cameraId
          ? { deviceId: { exact: ids.cameraId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
          : (ids.cameraId === undefined ? undefined : true),
        audio: ids.micId
          ? { deviceId: { exact: ids.micId }, echoCancellation: true, noiseSuppression: true }
          : (ids.micId === undefined ? undefined : true),
      });

      // Replace video track
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(newVideoTrack);
      }

      // Replace audio track
      const newAudioTrack = newStream.getAudioTracks()[0];
      if (newAudioTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
        if (sender) await sender.replaceTrack(newAudioTrack);
      }

      // Stop old tracks
      localStreamRef.current?.getTracks().forEach((t) => {
        // Keep screen share video track if active
        if (screenStreamRef.current?.getTracks().includes(t)) return;
        t.stop();
      });

      // Build new combined stream (keep video state)
      const combined = new MediaStream();
      if (newVideoTrack) {
        newVideoTrack.enabled = isCameraOn;
        combined.addTrack(newVideoTrack);
      }
      if (newAudioTrack) {
        newAudioTrack.enabled = isMicOn;
        combined.addTrack(newAudioTrack);
      }

      localStreamRef.current = combined;
      setLocalStream(combined);

      // Apply speaker output if supported
      if (ids.speakerId) {
        deviceIdsRef.current.speakerId = ids.speakerId;
        // speakerId is applied to audio elements from outside (LiveStudioPage)
      }
    } catch (err) {
      console.error("[switchDevices] Failed:", err);
    }
  }, [isCameraOn, isMicOn]);

  // ─── Use remote device track as camera or mic source ──────
  // Pulls the track from Cloudflare into the host session and
  // replaces the active sender so viewers see/hear the remote device.
  const useRemoteTrack = useCallback(async (
    remoteSessionId: string,
    trackName: string,
    kind: "video" | "audio",
  ) => {
    const pc = pcRef.current;
    if (!pc || !sessionIdRef.current) return;

    try {
      // Add a recvonly transceiver so Cloudflare knows we want this track
      pc.addTransceiver(kind, { direction: "recvonly" });

      const pullResult = await cfPullTracks(user, liveId, sessionIdRef.current, [{
        location: "remote",
        trackName,
        sessionId: remoteSessionId,
      }]);

      if (pullResult.requiresImmediateRenegotiation && pullResult.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(pullResult.sessionDescription));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await cfRenegotiate(user, liveId, sessionIdRef.current, pc.localDescription!);
      } else if (pullResult.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(pullResult.sessionDescription));
      }

      // When the track arrives via ontrack, replace the outgoing sender
      // so all viewers receive the remote device's stream instead of local
      const handleTrack = async (event: RTCTrackEvent) => {
        const incomingTrack = event.track;
        if (incomingTrack.kind !== kind) return;

        const sender = pc.getSenders().find((s) => s.track?.kind === kind);
        if (sender) {
          await sender.replaceTrack(incomingTrack);
          console.log(`[Host] Remote ${kind} track active:`, incomingTrack.id);
        }

        // Update local preview stream
        if (localStreamRef.current) {
          const oldTracks = kind === "video"
            ? localStreamRef.current.getVideoTracks()
            : localStreamRef.current.getAudioTracks();
          oldTracks.forEach((t) => {
            localStreamRef.current!.removeTrack(t);
            t.stop();
          });
          localStreamRef.current.addTrack(incomingTrack);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        }

        pc.removeEventListener("track", handleTrack);
      };

      pc.addEventListener("track", handleTrack);
    } catch (err) {
      console.error(`[Host] useRemoteTrack(${kind}) failed:`, err);
    }
  }, [user, liveId]);

  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current) return;

    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      if (localStreamRef.current) {
        const camTrack = localStreamRef.current.getVideoTracks()[0];
        if (camTrack) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(camTrack);
        }
      }
      setIsScreenSharing(false);
    } else {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as MediaTrackConstraints,
        audio: false,
      });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
      if (sender && screenTrack) sender.replaceTrack(screenTrack);
      screenTrack.onended = () => toggleScreenShare();
      setIsScreenSharing(true);
    }
  }, [isScreenSharing]);

  // ─── Sync deviceIds prop → ref ────────────────────────────
  useEffect(() => {
    if (deviceIds) {
      deviceIdsRef.current = deviceIds;
    }
  }, [deviceIds]);

  // ─── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      const sid = sessionIdRef.current;
      pcRef.current?.close();
      pcRef.current = null;
      speakerPcRef.current?.close();
      speakerPcRef.current = null;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      if (sid) {
        user.getIdToken().then((token) => {
          fetch(`/api/signaling?liveId=${liveId}&sessionId=${sid}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }).catch(() => {});
      }
    };
  }, []);

  return {
    localStream,
    remoteStreams,
    sessionId,
    connected,
    error,
    join,
    leave,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    enableSpeaker,
    pullSpeakerTracks,
    switchDevices,
    useRemoteTrack,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    isSpeaker,
  };
}
