export type QuestionType = "multiple_choice" | "true_false" | "short_answer";

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface Exam {
  id?: string;
  // Ligação ao conteúdo — obrigatório courseId OU liveId
  courseId: string;
  courseTitle?: string;
  /** Tipo do curso (standalone/smart/golden) — usado para verificar acesso */
  courseType?: "standalone" | "smart" | "golden";
  /** Preço do curso — usado para verificar se é gratuito */
  coursePrice?: number;
  /** Se o exame é sobre uma aula ao vivo em vez de um curso */
  liveId?: string;
  liveTitle?: string;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number;
  timeLimit?: number | null;
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
  liveId?: string;
  userId: string;
  userName: string;
  answers: Record<string, string>;
  score: number;
  passed: boolean;
  startedAt?: unknown;
  completedAt?: unknown;
}
