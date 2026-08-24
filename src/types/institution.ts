export type InstitutionStatus = "pending" | "approved" | "suspended";
export type InvitationRole = "teacher" | "student";
export type InvitationStatus = "pending" | "accepted" | "expired";
export type InstitutionUserRole = "admin" | "teacher" | "student";

export interface Institution {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
  banner?: string;
  description?: string;
  website?: string;
  status: InstitutionStatus;
  adminId: string; // User ID of the institution admin
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface InstitutionInvitation {
  id?: string;
  institutionId: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  token: string;
  invitedBy: string; // User ID who sent the invitation
  expiresAt: string; // ISO datetime
  createdAt?: unknown;
}

export interface InstitutionUser {
  institutionId: string;
  institutionRole: InstitutionUserRole;
}

export interface InstitutionMember {
  id?: string;
  institutionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhoto?: string;
  role: "teacher" | "student";
  addedBy: string;
  addedAt?: unknown;
  status: "active" | "inactive";
}
