export type QuestionType = "multiple_choice" | "true_false" | "short_answer";

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];        // for multiple_choice and true_false
  correctAnswer: string;     // the correct option index or text
  points: number;
}

export interface Exam {
  id?: string;
  courseId: string;
  courseTitle?: string;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number;       // percentage (0-100)
  timeLimit?: number;         // minutes, optional
  maxAttempts: number;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExamResult {
  id?: string;
  examId: string;
  examTitle: string;
  courseId: string;
  userId: string;
  userName: string;
  answers: Record<string, string>;  // questionId → answer
  score: number;                     // percentage (0-100)
  passed: boolean;
  startedAt?: unknown;
  completedAt?: unknown;
}
