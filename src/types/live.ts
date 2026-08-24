import type { CourseMaterial } from "./course";

export type LiveStatus = "scheduled" | "live" | "ended";
export type LiveTarget = "free" | "standalone";
export type RecordingStatusLive = "none" | "recording" | "uploading" | "ready" | "error";

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
  assignedInstitutionId?: string; // ID da instituição que atribuiu o professor
  hostName?: string;
  hostUid?: string;          // UID do professor anfitrião
  roomName: string;           // unique room slug
  startedAt?: string;
  endedAt?: string;
  participantCount?: number;
  views?: number;
  recordingUrl?: string;      // R2 URL after recording saved
  recordingStatus?: RecordingStatusLive;
  materials?: CourseMaterial[];
  // Q&A fields
  qaMode?: boolean;
  qaQuestions?: QAQuestion[];
  // Attendance fields
  attendanceEvents?: AttendanceEvent[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface QAQuestion {
  id: string;
  question: string;
  askedBy: string;           // uid
  askedByName: string;
  askedAt: string;           // ISO datetime
  answers: QAAnswer[];
  status: "pending" | "answered" | "dismissed";
  upvotes: number;
}

export interface QAAnswer {
  id: string;
  answer: string;
  answeredBy: string;        // uid (professor)
  answeredByName: string;
  answeredAt: string;        // ISO datetime
}

export interface AttendanceEvent {
  uid: string;
  displayName: string;
  joinedAt: string;          // ISO datetime
  leftAt?: string;           // ISO datetime (null if still in session)
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
