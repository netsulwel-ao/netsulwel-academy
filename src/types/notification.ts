export type NotificationType =
  | "payment_approved"
  | "sale_completed"
  | "fee_applied"
  | "live_started"
  | "course_live_started"
  | "community_like"
  | "community_comment"
  | "certificate_ready"
  | "institution_invitation"
  | "institution_approved"
  | "course_published";

export interface AppNotification {
  id?: string;
  uid: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: unknown;
}
