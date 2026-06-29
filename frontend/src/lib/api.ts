const API_BASE_URL = 'http://localhost:8888/api';

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
  role: 'USER' | 'INSTRUCTOR' | 'ADMIN';
  avatarUrl?: string;
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
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  exploitationGuide: string;
  preventionGuide: string;
  labCount?: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedHours: number;
  lessonCount?: number;
  completedLessons?: number;
}

export interface Lab {
  id: string;
  vulnerabilityId: string;
  vulnerabilitySlug: string;
  vulnerabilityName: string;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  dockerImage: string;
  dockerPort: number;
  estimatedMinutes: number;
  points: number;
  hintsJson?: string;
}

export interface LabAttempt {
  id: string;
  userId: string;
  labId: string;
  labTitle: string;
  containerId?: string;
  containerPort?: number;
  status: 'STARTED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  startedAt: string;
  completedAt?: string;
  flagSubmitted?: string;
  score: number;
  hintsUsed: number;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;
  
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('sechub_token') : null;
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
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
    throw new Error('Không thể phân tích phản hồi từ máy chủ.');
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sechub_token');
        localStorage.removeItem('sechub_refresh_token');
        localStorage.removeItem('sechub_user');
        window.dispatchEvent(new Event('sechub_logout'));
      }
    }
    const errorMsg = json.message || `Lỗi máy chủ (${response.status})`;
    throw new Error(errorMsg);
  }

  return json as ApiResponse<T>;
}

export const api = {
  auth: {
    login: async (username: string, password: string) => {
      const res = await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (res.success && res.data) {
        localStorage.setItem('sechub_token', res.data.token);
        localStorage.setItem('sechub_refresh_token', res.data.refreshToken);
        localStorage.setItem('sechub_user', JSON.stringify(res.data.user));
      }
      return res;
    },
    register: async (username: string, email: string, password: string) => {
      const res = await request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      if (res.success && res.data) {
        localStorage.setItem('sechub_token', res.data.token);
        localStorage.setItem('sechub_refresh_token', res.data.refreshToken);
        localStorage.setItem('sechub_user', JSON.stringify(res.data.user));
      }
      return res;
    },
    logout: () => {
      localStorage.removeItem('sechub_token');
      localStorage.removeItem('sechub_refresh_token');
      localStorage.removeItem('sechub_user');
    },
    getCurrentUser: (): User | null => {
      if (typeof window === 'undefined') return null;
      const userStr = localStorage.getItem('sechub_user');
      return userStr ? JSON.parse(userStr) : null;
    }
  },

  vulnerabilities: {
    getAll: () => request<Vulnerability[]>('/vulnerabilities'),
    getBySlug: (slug: string) => request<Vulnerability>(`/vulnerabilities/slug/${slug}`),
    getLabs: (id: string) => request<Lab[]>(`/vulnerabilities/${id}/labs`),
  },

  labs: {
    getAll: () => request<Lab[]>('/api/labs'), // Wait, request takes path relative to base API. So `/labs` is `/api/labs` if base is `/api`
    // Let's verify base API. Base is `http://localhost:8888/api`. So path `/labs` resolves to `/api/labs`. Let's use `/labs` instead of `/api/labs`!
    getLabs: () => request<Lab[]>('/labs'),
    getById: (id: string) => request<Lab>(`/labs/${id}`),
    startLab: (id: string) => request<LabAttempt>(`/labs/${id}/start`, { method: 'POST' }),
    stopLab: (attemptId: string) => request<LabAttempt>(`/labs/attempts/${attemptId}/stop`, { method: 'POST' }),
    submitFlag: (attemptId: string, flag: string) => request<LabAttempt>(`/labs/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ flag }),
    }),
    useHint: (attemptId: string) => request<LabAttempt>(`/labs/attempts/${attemptId}/hint`, { method: 'POST' }),
    getMyAttempts: () => request<LabAttempt[]>('/labs/attempts/me'),
    getLabAttempts: (id: string) => request<LabAttempt[]>(`/labs/${id}/attempts`),
  },

  learningPaths: {
    getAll: () => request<LearningPath[]>('/learning-paths'),
    getById: (id: string) => request<LearningPath>(`/learning-paths/${id}`),
    getLessons: (id: string) => request<any[]>(`/learning-paths/${id}/lessons`),
  },

  users: {
    getDashboard: () => request<any>('/users/me/dashboard'),
  },

  progress: {
    getPathProgress: (pathId: string) => request<any[]>(`/progress/paths/${pathId}`),
    completeLesson: (lessonId: string) => request<any>(`/progress/lessons/${lessonId}/complete`, { method: 'POST' }),
  }
};
