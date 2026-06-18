export interface ModuleQuiz {
  id?: string;
  courseId: string;
  moduleIndex: number;
  moduleTitle: string;
  questions: ModuleQuizQuestion[];
  passingScore: number;
  maxAttempts: number;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ModuleQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface ModuleQuizResult {
  id?: string;
  quizId: string;
  courseId: string;
  moduleIndex: number;
  userId: string;
  userName: string;
  score: number;
  passed: boolean;
  answers: Record<string, number>;
  completedAt?: unknown;
  attempt: number;
}
