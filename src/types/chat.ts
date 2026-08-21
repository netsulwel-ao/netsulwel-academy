export interface CourseChat {
  id?: string;
  type: "group" | "individual";
  courseId: string;
  courseTitle: string;
  courseThumbnail?: string;
  createdBy: string;
  createdAt: Date;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageBy?: string;
  lastMessageByName?: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantPhotos: Record<string, string>;
  unreadBy?: Record<string, number>;
  otherRole?: "teacher" | "student";
}

export interface ChatMessage {
  id?: string;
  chatId: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  text: string;
  type: "text" | "system";
  createdAt: Date;
}
