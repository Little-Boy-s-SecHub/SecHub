const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://api.littleboys.biz/api"
    : "http://localhost:8888/api");

function normalizeApiPath(path: string): string {
  const pathname = path.startsWith("http")
    ? new URL(path).pathname
    : path.split("?")[0];
  const withoutApiPrefix = pathname.startsWith("/api/")
    ? pathname.slice("/api".length)
    : pathname;
  return withoutApiPrefix.startsWith("/") ? withoutApiPrefix : `/${withoutApiPrefix}`;
}

function isPublicGetPath(path: string, method: string): boolean {
  if (method !== "GET") {
    return false;
  }

  const normalized = normalizeApiPath(path);
  if (normalized === "/labs" || /^\/labs\/[^/]+$/.test(normalized)) {
    return true;
  }

  return normalized.startsWith("/vulnerabilities")
    || normalized.startsWith("/learning-paths")
    || normalized.startsWith("/lessons")
    || normalized.startsWith("/growth/public")
    || normalized === "/growth/leaderboard"
    || normalized.startsWith("/lab-runtime");
}

function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("sechub_token");
  localStorage.removeItem("sechub_refresh_token");
  localStorage.removeItem("sechub_user");
}

export function isAuthExpiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /401|unauthorized|expired|invalid|hết hạn|không hợp lệ/i.test(message);
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string>;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: "USER" | "INSTRUCTOR" | "ADMIN";
  avatarUrl?: string;
  notificationsEnabled: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface Vulnerability {
  id: string;
  slug: string;
  name: string;
  icon: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  exploitationGuide: string;
  preventionGuide: string;
  labCount?: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedHours: number;
  lessonCount?: number;
  completedLessons?: number;
  status?: "DRAFT" | "PUBLISHED";
}

export interface Lab {
  id: string;
  vulnerabilityId: string;
  vulnerabilitySlug: string;
  vulnerabilityName: string;
  title: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  dockerImage: string;
  generated: boolean;
  dockerPort: number;
  estimatedMinutes: number;
  points: number;
  hintsJson?: string;
  status?: "DRAFT" | "PUBLISHED";
}

export interface LabAttempt {
  id: string;
  userId: string;
  labId: string;
  labTitle: string;
  containerId?: string;
  containerPort?: number;
  runtimeUrl?: string;
  status: "STARTED" | "RUNNING" | "COMPLETED" | "FAILED" | "EXPIRED";
  startedAt: string;
  completedAt?: string;
  expiresAt?: string;
  extensionCount: number;
  flagSubmitted?: string;
  score: number;
  hintsUsed: number;
}

export interface LabFeedback {
  vulnerabilityName: string;
  summary: string;
  whyItWorked: string;
  vulnerableCode: string;
  secureCode: string;
  remediationSteps: string[];
  lessonTakeaway: string;
  nextLabId?: string;
  nextLabTitle?: string;
  nextLabDifficulty?: string;
}

export interface MentorGuidance {
  question: string;
  focusArea: string;
  hintAvailable: boolean;
  stage: number;
}

export interface GrowthOverview {
  onboardingRequired: boolean;
  assessmentCompleted: boolean;
  recommendedTrack: "BEGINNER" | "WEB_DEVELOPER" | "PENTESTER";
  assessmentScore: number;
  xp: number;
  level: number;
  streak: number;
  freezeTickets: number;
  levelTitle: string;
  skills: Array<{ slug: string; name: string; xp: number; level: number; completedLabs: number; averageHints: number }>;
  badges: string[];
  dailyMission: { title: string; description: string; actionUrl: string; minutes: number; completed: boolean };
  weeklyChallenge: { title: string; description: string; actionUrl: string; minutes: number; completed: boolean };
  weeklyReport: { labsCompleted: number; lessonsCompleted: number; xpGained: number; strongestSkill: string; weakSkill: string; recommendation: string };
  notifications: string[];
}

export interface AppNotification {
  id: string;
  type: "LAB_PUBLISHED" | "LAB_COMPLETED" | "SYSTEM";
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface PublicProfile {
  username: string;
  xp: number;
  level: number;
  levelTitle: string;
  completedLabs: number;
  skills: GrowthOverview["skills"];
  badges: string[];
  shareText: string;
}

export interface LeaderboardEntry {
  username: string;
  track: "BEGINNER" | "WEB_DEVELOPER" | "PENTESTER";
  weeklyXp: number;
  labsCompleted: number;
  lessonsCompleted: number;
  strongestSkill: string;
}

export interface Flashcard {
  id: string;
  lessonId: string;
  lessonTitle: string;
  type: "CODE_REVIEW" | "PAYLOAD" | "MULTIPLE_CHOICE";
  question: string;
  code?: string;
  choices: string[];
  explanation?: string;
  vulnerabilitySlug?: string;
  nextReviewAt: string;
  repetitions: number;
  correctCount: number;
  wrongCount: number;
}

export interface ReviewDashboard {
  dueCount: number;
  totalCards: number;
  completedToday: number;
  cards: Flashcard[];
}

export interface ResumeLearning {
  type: "LESSON" | "LAB";
  url: string;
  title: string;
  subtitle: string;
  progress?: number;
  scrollY?: number;
  lessonId?: string;
  labId?: string;
  attemptId?: string;
  hintsUsed?: number;
  updatedAt: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;
  const method = (options.method ?? "GET").toUpperCase();

  // Get token from localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("sechub_token") : null;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token && !isPublicGetPath(path, method)) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error("Không thể phân tích phản hồi từ máy chủ.");
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        clearStoredSession();
        window.dispatchEvent(new Event("sechub_logout"));
      }
    }
    const errorMsg = json.message || `Lỗi máy chủ (${response.status})`;
    throw new Error(errorMsg);
  }

  return json as ApiResponse<T>;
}

export function resolveApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  if (cleanPath.startsWith('api/')) {
    const origin = new URL(API_BASE_URL).origin;
    return `${origin}/${cleanPath}`;
  }
  const baseUrlWithSlash = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  return `${baseUrlWithSlash}${cleanPath}`;
}

export function parseBackendDate(dateStr: string | Date | undefined | null): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !/-\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}Z`);
  }
  return new Date(dateStr);
}

export const api = {
  auth: {
    login: async (username: string, password: string) => {
      const res = await request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (res.success && res.data) {
        localStorage.setItem("sechub_token", res.data.token);
        localStorage.setItem("sechub_refresh_token", res.data.refreshToken);
        localStorage.setItem("sechub_user", JSON.stringify(res.data.user));
      }
      return res;
    },
    register: async (username: string, email: string, password: string) => {
      const res = await request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });
      if (res.success && res.data) {
        localStorage.setItem("sechub_token", res.data.token);
        localStorage.setItem("sechub_refresh_token", res.data.refreshToken);
        localStorage.setItem("sechub_user", JSON.stringify(res.data.user));
      }
      return res;
    },
    logout: () => {
      localStorage.removeItem("sechub_token");
      localStorage.removeItem("sechub_refresh_token");
      localStorage.removeItem("sechub_user");
    },
    getCurrentUser: (): User | null => {
      if (typeof window === "undefined") return null;
      const userStr = localStorage.getItem("sechub_user");
      return userStr ? JSON.parse(userStr) : null;
    },
  },

  vulnerabilities: {
    getAll: () => request<Vulnerability[]>("/vulnerabilities"),
    getBySlug: (slug: string) =>
      request<Vulnerability>(`/vulnerabilities/slug/${slug}`),
    getLabs: (id: string) => request<Lab[]>(`/vulnerabilities/${id}/labs`),
  },

  labs: {
    getAll: () => request<Lab[]>("/labs"),
    getLabs: () => request<Lab[]>("/labs"),
    getById: (id: string) => request<Lab>(`/labs/${id}`),
    deleteGenerated: (id: string) => request<void>(`/labs/${id}`, { method: "DELETE" }),
    startLab: (id: string) =>
      request<LabAttempt>(`/labs/${id}/start`, { method: "POST" }),
    stopLab: (attemptId: string) =>
      request<LabAttempt>(`/labs/attempts/${attemptId}/stop`, {
        method: "POST",
      }),
    submitFlag: (attemptId: string, flag: string) =>
      request<LabAttempt>(`/labs/attempts/${attemptId}/submit`, {
        method: "POST",
        body: JSON.stringify({ flag }),
      }),
    useHint: (attemptId: string) =>
      request<LabAttempt>(`/labs/attempts/${attemptId}/hint`, {
        method: "POST",
      }),
    extendTime: (attemptId: string) =>
      request<LabAttempt>(`/labs/attempts/${attemptId}/extend`, {
        method: "POST",
      }),
    getMyAttempts: () => request<LabAttempt[]>("/labs/attempts/me"),
    getLabAttempts: (id: string) =>
      request<LabAttempt[]>(`/labs/${id}/attempts`),
    getFeedback: (attemptId: string) =>
      request<LabFeedback>(`/labs/attempts/${attemptId}/feedback`),
    getMentor: (attemptId: string) =>
      request<MentorGuidance>(`/labs/attempts/${attemptId}/mentor`),
    generateWithAi: (vulnerabilitySlug: string, difficulty: string, scenario: string, language?: string) =>
      request<Lab>("/ai/generate-lab", {
        method: "POST",
        body: JSON.stringify({ vulnerabilitySlug, difficulty, scenario, language: language || "en" }),
      }),
  },

  learningPaths: {
    getAll: () => request<LearningPath[]>("/learning-paths"),
    getById: (id: string) => request<LearningPath>(`/learning-paths/${id}`),
    getLessons: (id: string) => request<any[]>(`/learning-paths/${id}/lessons`),
  },

  lessons: {
    getById: (id: string) => request<any>(`/lessons/${id}`),
  },

  users: {
    getMe: () => request<User>("/users/me"),
    getDashboard: () => request<any>("/users/me/dashboard"),
    getActivities: () => request<any[]>("/users/me/activities"),
    getResume: (onlyLesson?: boolean) => request<ResumeLearning | null>(`/users/me/resume${onlyLesson ? "?onlyLesson=true" : ""}`),
    saveLearningState: (lessonId: string, scrollProgress: number, scrollY: number) =>
      request<ResumeLearning>("/users/me/learning-state", {
        method: "PUT",
        body: JSON.stringify({ lessonId, scrollProgress, scrollY }),
      }),
    updateNotifications: (enabled: boolean) =>
      request<User>("/users/me/notifications", {
        method: "PUT",
        body: JSON.stringify({ enabled }),
      }),
  },

  notifications: {
    list: () => request<AppNotification[]>("/notifications"),
    markRead: (ids: string[]) => request<AppNotification[]>("/notifications/read", {
      method: "PUT",
      body: JSON.stringify({ ids }),
    }),
  },

  progress: {
    getPathProgress: (pathId: string) =>
      request<any[]>(`/progress/paths/${pathId}`),
    completeLesson: (lessonId: string) =>
      request<any>(`/progress/lessons/${lessonId}/complete`, {
        method: "POST",
      }),
  },
  review: {
    getDashboard: () => request<ReviewDashboard>("/review"),
    answer: (id: string, answer: string, rating: "AGAIN" | "HARD" | "GOOD" | "EASY") =>
      request<{ correct: boolean; correctAnswer: string; explanation: string; nextReviewAt: string }>(`/review/${id}/answer`, {
        method: "POST",
        body: JSON.stringify({ answer, rating }),
      }),
    getDailyLab: () => request<Lab>("/review/daily-lab", { method: "POST" }),
  },
  growth: {
    getOverview: () => request<GrowthOverview>("/growth"),
    submitAssessment: (answers: number[]) => request<GrowthOverview>("/growth/assessment", {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
    getWeeklyLab: () => request<Lab>("/growth/weekly-lab", { method: "POST" }),
    createHarderVariant: (attemptId: string) => request<Lab>(`/growth/harder/${attemptId}`, { method: "POST" }),
    getPublicProfile: (username: string) => request<PublicProfile>(`/growth/public/${username}`),
    getPublicActivities: (username: string) => request<any[]>(`/growth/public/${username}/activities`),
    getLeaderboard: (track?: string) => request<LeaderboardEntry[]>(`/growth/leaderboard${track ? `?track=${encodeURIComponent(track)}` : ''}`),
    updateRecommendedTrack: (track: string) => request<GrowthOverview>("/growth/track", { method: "PUT", body: JSON.stringify({ track }) }),
    resetOnboarding: () => request<GrowthOverview>("/growth/reset-onboarding", { method: "POST" }),
  },
  author: {
    getWorkspace: () => request<{ paths: LearningPath[]; labs: Lab[] }>("/author"),
    createPath: (body: { title: string; description: string; difficulty: string; estimatedHours: number }) => request<LearningPath>("/author/paths", { method: "POST", body: JSON.stringify(body) }),
    addLesson: (pathId: string, body: { title: string; contentMarkdown: string; learningObjective: string; estimatedMinutes: number; vulnerabilityId?: string }) => request<any>(`/author/paths/${pathId}/lessons`, { method: "POST", body: JSON.stringify(body) }),
    publishPath: (id: string) => request<void>(`/author/paths/${id}/publish`, { method: "POST" }),
    createLab: (body: { vulnerabilitySlug: string; difficulty: string; title: string; scenario: string }) => request<Lab>("/author/labs", { method: "POST", body: JSON.stringify(body) }),
    publishLab: (id: string) => request<void>(`/author/labs/${id}/publish`, { method: "POST" }),
    deletePath: (id: string) => request<void>(`/author/paths/${id}`, { method: "DELETE" }),
    deleteLab: (id: string) => request<void>(`/author/labs/${id}`, { method: "DELETE" }),
  },
};
