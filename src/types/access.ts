export interface PrivateAccessLink {
  id?: string;
  courseId?: string;
  liveId?: string;
  token: string; // unique, URL-safe
  createdBy: string; // teacher/admin UID
  createdAt: number; // timestamp
  expiresAt?: number; // optional expiration
  maxUses?: number;
  usedCount: number;
  usedBy: string[]; // array of UIDs who used this link
  status: "active" | "expired" | "revoked";
}

export interface AccessLog {
  id?: string;
  userId: string;
  linkToken: string;
  courseId?: string;
  liveId?: string;
  grantedAt: number;
  accessType: "course" | "live";
}
