import type { CourseMaterial } from "./course";

export type LiveStatus = "scheduled" | "live" | "ended";
export type LiveTarget = "free" | "smart" | "golden" | "standalone";

export interface LiveSession {
  id?: string;
  title: string;
  description: string;
  thumbnail: string;
  scheduledAt: string;        // ISO datetime
  target: LiveTarget;
  price?: number;             // only for standalone
  status: LiveStatus;
  createdBy: string;          // admin UID (consistente com courses/trails)
  institutionId?: string;     // ID da instituição a que pertence
  hostName?: string;
  roomName: string;           // LiveKit room slug
  startedAt?: string;
  endedAt?: string;
  participantCount?: number;
  views?: number;
  recordingUrl?: string;      // R2 URL after recording saved
  materials?: CourseMaterial[];
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
  hidden?: boolean;        // soft-delete flag
  hiddenAt?: unknown;      // timestamp of hiding
  createdAt: unknown;
}
