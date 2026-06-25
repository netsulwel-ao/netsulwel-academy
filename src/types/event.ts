export type EventType =
  | "page_view"
  | "course_view"
  | "course_enroll"
  | "lesson_complete"
  | "course_complete"
  | "search_query"
  | "video_watch"
  | "teacher_follow"
  | "teacher_unfollow"
  | "community_post"
  | "live_join"
  | "live_leave";

export interface TrackEvent {
  userId: string;
  type: EventType;
  targetId?: string;
  targetType?: "course" | "live" | "teacher" | "community" | "trail";
  metadata?: Record<string, string | number | boolean>;
  createdAt: Date;
}
