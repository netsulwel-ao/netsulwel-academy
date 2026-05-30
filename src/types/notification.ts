export type NotificationType = "payment_approved" | "live_started" | "course_live_started" | "community_like" | "community_comment";

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
