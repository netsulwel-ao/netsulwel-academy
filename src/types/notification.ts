export type NotificationType =
  | "payment_approved"
  | "live_started"
  | "community_like"
  | "community_comment"
  | "certificate_ready"
  | "institution_approved"
  | "live_approved"
  | "live_rejected"
  | "recording_ready"
  | "new_question"
  | "question_answered";

export interface AppNotification {
  id?: string;
  uid: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: unknown;
  count?: number;
}
