export type LiveStatus = "scheduled" | "live" | "ended";
export type LiveTarget = "free" | "smart" | "golden";

export interface LiveSession {
  id?: string;
  title: string;
  description: string;
  thumbnail: string;
  scheduledAt: string;        // ISO datetime
  target: LiveTarget;
  status: LiveStatus;
  hostUid: string;            // admin UID
  hostName?: string;
  roomName: string;           // LiveKit room slug
  startedAt?: string;
  endedAt?: string;
  participantCount?: number;
  recordingUrl?: string;      // R2 URL after recording saved
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id?: string;
  liveId: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  text: string;
  type: "message" | "hand_raise" | "system";
  createdAt: unknown;
}
