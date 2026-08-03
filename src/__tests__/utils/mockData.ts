/**
 * Mock data for testing
 */

export const mockCourse = {
  id: "course-123",
  title: "Introdução a React",
  description: "Aprenda React do zero",
  instructor: "John Doe",
  price: 99.99,
  level: "beginner",
  students: 150,
  rating: 4.5,
  reviews: 42,
  duration: "10 horas",
  modules: 5,
  lessons: 25,
  image: "https://example.com/image.jpg",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-08-03"),
};

export const mockLive = {
  id: "live-123",
  title: "Live Session - React Patterns",
  description: "Padrões avançados em React",
  instructor: "Jane Smith",
  scheduledAt: new Date("2026-08-05T20:00:00"),
  duration: 120,
  maxParticipants: 100,
  currentParticipants: 45,
  status: "scheduled" as const,
  recordingStatus: "ready" as const,
  roomId: "room-123",
};

export const mockTrail = {
  id: "trail-123",
  title: "Trilha Full Stack JavaScript",
  description: "De iniciante a profissional",
  courses: 8,
  duration: "40 horas",
  level: "intermediate",
  students: 320,
  rating: 4.7,
};

export const mockUser = {
  uid: "user-123",
  email: "user@example.com",
  displayName: "Test User",
  photoURL: null,
  role: "aluno" as const,
  plan: "free" as const,
  createdAt: new Date("2026-01-01"),
};

export const mockAdmin = {
  ...mockUser,
  uid: "admin-123",
  displayName: "Admin User",
  role: "admin" as const,
  plan: "golden" as const,
};

export const mockTeacher = {
  ...mockUser,
  uid: "teacher-123",
  displayName: "Teacher User",
  role: "teacher" as const,
  plan: "smart" as const,
};

export const mockCommunityPost = {
  id: "post-123",
  author: mockUser.uid,
  authorName: mockUser.displayName,
  content: "Alguém pode me ajudar com React?",
  type: "question" as const,
  tags: ["react", "javascript"],
  likes: 12,
  comments: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockNotification = {
  id: "notif-123",
  userId: mockUser.uid,
  title: "Novo curso disponível",
  message: "Um novo curso foi adicionado na sua trilha",
  type: "course" as const,
  read: false,
  createdAt: new Date(),
  actionUrl: "/dashboard/courses/course-456",
};

export const mockEvent = {
  id: "event-123",
  userId: mockUser.uid,
  type: "course_enrolled" as const,
  metadata: {
    courseId: mockCourse.id,
    courseTitle: mockCourse.title,
  },
  createdAt: new Date(),
};
