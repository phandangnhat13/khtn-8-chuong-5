const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiResponse<T> = { data: T };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

export type LessonId = "20" | "21-22" | "23" | "24-25";

export type QuizSummary = {
  lessonId: LessonId;
  lessonTitle: string;
  totalQuestions: number;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type LessonQuizPayload = {
  lessonId: LessonId;
  lessonTitle: string;
  questions: QuizQuestion[];
};

export type SubmitQuizPayload = {
  studentName?: string;
  answers: number[];
};

export type SubmitQuizResult = {
  attemptId: string;
  lessonId: LessonId;
  score: number;
  total: number;
  percentage: number;
  submittedAt: string;
  details: Array<{
    questionId: string;
    correct: boolean;
    userAnswerIndex: number | null;
    correctAnswerIndex: number;
    explanation: string;
  }>;
};

export type StatsOverview = {
  totalAttempts: number;
  byLesson: Array<{
    lessonId: LessonId;
    lessonTitle: string;
    attempts: number;
    averagePercentage: number;
    latestAttempt: string | null;
  }>;
};

export type QuizAttemptRecord = SubmitQuizResult & {
  studentName: string;
};

export const api = {
  getQuizzes: () => request<QuizSummary[]>("/api/quizzes"),
  getQuizByLesson: (lessonId: LessonId) => request<LessonQuizPayload>(`/api/quizzes/${lessonId}`),
  submitQuiz: (lessonId: LessonId, payload: SubmitQuizPayload) =>
    request<SubmitQuizResult>(`/api/quizzes/${lessonId}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getStatsOverview: () => request<StatsOverview>("/api/stats/overview"),
  getAttempts: () => request<QuizAttemptRecord[]>("/api/attempts"),
};

