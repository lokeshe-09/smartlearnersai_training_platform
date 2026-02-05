/**
 * API Service for Smart Learners AI
 * Handles all communication with the Django backend
 */

const API_BASE_URL = 'http://localhost:8000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  user?: T;
  errors?: Record<string, string[]>;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for session cookies
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    return {
      success: false,
      message: 'Network error. Please check if the server is running.',
    };
  }
}

/**
 * Authentication API functions
 */
// ============================================
// AI GRADING TYPES
// ============================================
interface LabInfo {
  title: string;
  category: string;
  description: string;
  requirements: string[];
}

interface CellInfo {
  index: number;
  type: string;
  source: string;
  executionCount?: number | null;
  outputs: any[];
}

interface RequirementAnalysis {
  requirement: string;
  status: 'met' | 'partial' | 'not_met';
  explanation: string;
}

interface GradingResult {
  success: boolean;
  overall_score: number;
  code_quality: number;
  accuracy: number;
  efficiency: number;
  requirements_analysis: RequirementAnalysis[];
  strengths: string[];
  areas_for_improvement: string[];
  detailed_feedback: string;
  code_suggestions: string[];
  learning_resources: string[];
  error?: string;
}

interface GradingResponse {
  success: boolean;
  message: string;
  grading_result: GradingResult | null;
}

// ============================================
// AUTHENTICATION API
// ============================================
export const authAPI = {
  /**
   * Login with username/email and password
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    return apiRequest<User>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * Register a new user
   */
  signup: async (userData: SignupData): Promise<ApiResponse<User>> => {
    return apiRequest<User>('/auth/signup/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<ApiResponse> => {
    return apiRequest('/auth/logout/', {
      method: 'POST',
    });
  },

  /**
   * Check if user is authenticated
   */
  checkAuth: async (): Promise<{ authenticated: boolean; user: User | null }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check/`, {
        credentials: 'include',
      });
      return response.json();
    } catch {
      return { authenticated: false, user: null };
    }
  },

  /**
   * Get user profile
   */
  getProfile: async (): Promise<ApiResponse<User>> => {
    return apiRequest<User>('/auth/profile/', {
      method: 'GET',
    });
  },

  /**
   * Health check - verify backend is running
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/health/`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  },
};

// ============================================
// AI GRADING API
// ============================================

interface SubmissionData {
  lab_id: string;
  lab_title: string;
  lab_category: string;
  overall_score: number;
  code_quality: number;
  accuracy: number;
  efficiency: number;
  file_name: string;
  code_content: string;
  submitted_at: string;
  grading_result: GradingResult;
}

interface SubmissionsResponse {
  success: boolean;
  submissions: SubmissionData[];
}

interface SingleSubmissionResponse {
  success: boolean;
  message?: string;
  submission: SubmissionData | null;
}

export const aiAPI = {
  /**
   * Submit code for AI grading
   */
  gradeSubmission: async (
    labId: string,
    labInfo: LabInfo,
    codeContent: string,
    fileName?: string,
    cellsInfo?: CellInfo[]
  ): Promise<GradingResponse> => {
    const url = `${API_BASE_URL}/ai/grade/`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          lab_id: labId,
          lab_info: labInfo,
          code_content: codeContent,
          file_name: fileName || '',
          cells_info: cellsInfo || null,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('AI Grading Error:', error);
      return {
        success: false,
        message: 'Failed to connect to AI grading service. Please try again.',
        grading_result: null,
      };
    }
  },

  /**
   * Get all submissions for the current user
   */
  getUserSubmissions: async (): Promise<SubmissionsResponse> => {
    const url = `${API_BASE_URL}/ai/submissions/`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get Submissions Error:', error);
      return {
        success: false,
        submissions: [],
      };
    }
  },

  /**
   * Get a specific submission by lab ID
   */
  getSubmissionByLab: async (labId: string): Promise<SingleSubmissionResponse> => {
    const url = `${API_BASE_URL}/ai/submissions/${labId}/`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get Submission Error:', error);
      return {
        success: false,
        submission: null,
      };
    }
  },
};

// ============================================
// ASSESSMENT API
// ============================================

interface AssessmentSubmitData {
  assessment_id: number;
  assessment_title: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  passing_score: number;
}

interface AssessmentResult {
  assessment_id: number;
  assessment_title: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  passing_score: number;
  passed: boolean;
  completed_at: string;
}

interface AssessmentSubmitResponse {
  success: boolean;
  message: string;
  saved_to_db: boolean;
  result: {
    assessment_id: number;
    score: number;
    passed: boolean;
    is_retake: boolean;
  } | null;
}

interface AssessmentResultsResponse {
  success: boolean;
  results: AssessmentResult[];
}

export const assessmentAPI = {
  /**
   * Submit assessment result
   */
  submitAssessment: async (data: AssessmentSubmitData): Promise<AssessmentSubmitResponse> => {
    const url = `${API_BASE_URL}/ai/assessment/submit/`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Assessment Submit Error:', error);
      return {
        success: false,
        message: 'Failed to submit assessment',
        saved_to_db: false,
        result: null,
      };
    }
  },

  /**
   * Get all assessment results for the current user
   */
  getAssessmentResults: async (): Promise<AssessmentResultsResponse> => {
    const url = `${API_BASE_URL}/ai/assessment/results/`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get Assessment Results Error:', error);
      return {
        success: false,
        results: [],
      };
    }
  },
};

// ============================================
// ORCA AI CHAT API
// ============================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  success: boolean;
  message: string;
  response: string | null;
}

export const chatAPI = {
  /**
   * Send a message to OrcaAI
   */
  sendMessage: async (message: string, history: ChatMessage[]): Promise<ChatResponse> => {
    const url = `${API_BASE_URL}/ai/chat/`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message,
          history,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chat Error:', error);
      return {
        success: false,
        message: 'Failed to connect to OrcaAI',
        response: null,
      };
    }
  },
};

// ============================================
// EXAM MODE API
// ============================================

interface ExamQuestion {
  id: number;
  question: string;
  options: string[];
  topic: string;
}

interface ExamGenerateResponse {
  success: boolean;
  exam_id?: number;
  questions?: ExamQuestion[];
  total_questions?: number;
  difficulty?: string;
  duration_minutes?: number;
  message?: string;
}

interface ExamResultItem {
  question_id: number;
  question: string;
  options: string[];
  student_answer: number | null;
  correct_answer: number;
  is_correct: boolean;
  explanation: string;
  topic: string;
}

interface ExamSubmitResponse {
  success: boolean;
  message: string;
  score?: number;
  correct_count?: number;
  total_questions?: number;
  results?: ExamResultItem[];
}

interface ExamHistoryItem {
  id: number;
  difficulty: string;
  duration_minutes: number;
  total_questions: number;
  score: number;
  correct_count: number;
  created_at: string;
  completed_at: string | null;
}

interface ExamHistoryResponse {
  success: boolean;
  exams: ExamHistoryItem[];
}

interface ExamDetailExam {
  id: number;
  difficulty: string;
  duration_minutes: number;
  total_questions: number;
  score: number;
  correct_count: number;
  questions: any[];
  student_answers: Record<string, number>;
  results: ExamResultItem[];
  is_completed: boolean;
  created_at: string;
  completed_at: string | null;
}

interface ExamDetailResponse {
  success: boolean;
  exam?: ExamDetailExam;
  message?: string;
}

export const examAPI = {
  generateExam: async (difficulty: string, durationMinutes: number): Promise<ExamGenerateResponse> => {
    const url = `${API_BASE_URL}/ai/exam/generate/`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ difficulty, duration_minutes: durationMinutes }),
      });
      return response.json();
    } catch (error) {
      console.error('Exam Generate Error:', error);
      return { success: false, message: 'Failed to generate exam' };
    }
  },

  submitExam: async (examId: number, answers: Record<string, number | null>): Promise<ExamSubmitResponse> => {
    const url = `${API_BASE_URL}/ai/exam/submit/`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ exam_id: examId, answers }),
      });
      return response.json();
    } catch (error) {
      console.error('Exam Submit Error:', error);
      return { success: false, message: 'Failed to submit exam' };
    }
  },

  getHistory: async (): Promise<ExamHistoryResponse> => {
    const url = `${API_BASE_URL}/ai/exam/history/`;
    try {
      const response = await fetch(url, { method: 'GET', credentials: 'include' });
      return response.json();
    } catch (error) {
      console.error('Exam History Error:', error);
      return { success: false, exams: [] };
    }
  },

  getExamDetail: async (examId: number): Promise<ExamDetailResponse> => {
    const url = `${API_BASE_URL}/ai/exam/${examId}/`;
    try {
      const response = await fetch(url, { method: 'GET', credentials: 'include' });
      return response.json();
    } catch (error) {
      console.error('Exam Detail Error:', error);
      return { success: false, message: 'Failed to fetch exam details' };
    }
  },
};

// ============================================
// PROJECT EVALUATION API
// ============================================

interface ProjectEvalResult {
  success: boolean;
  overall_score: number;
  code_quality: number;
  completeness: number;
  technical_implementation: number;
  strengths: string[];
  areas_for_improvement: string[];
  detailed_feedback: string;
  file_reviews: { file_name: string; score: number; feedback: string }[];
}

interface ProjectEvalResponse {
  success: boolean;
  message: string;
  result: ProjectEvalResult | null;
}

export const projectAPI = {
  evaluateProject: async (
    projectInfo: { title: string; description: string; tech_stack: string[]; steps: string[] },
    filesContent: { file_name: string; content: string }[]
  ): Promise<ProjectEvalResponse> => {
    const url = `${API_BASE_URL}/ai/project/evaluate/`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_info: projectInfo,
          files_content: filesContent,
        }),
      });
      return response.json();
    } catch (error) {
      console.error('Project Evaluation Error:', error);
      return { success: false, message: 'Failed to evaluate project', result: null };
    }
  },
};

export type {
  User,
  LoginCredentials,
  SignupData,
  ApiResponse,
  LabInfo,
  CellInfo,
  GradingResult,
  GradingResponse,
  RequirementAnalysis,
  SubmissionData,
  SubmissionsResponse,
  SingleSubmissionResponse,
  AssessmentSubmitData,
  AssessmentResult,
  AssessmentSubmitResponse,
  AssessmentResultsResponse,
  ChatMessage,
  ChatResponse,
  ExamQuestion,
  ExamGenerateResponse,
  ExamResultItem,
  ExamSubmitResponse,
  ExamHistoryItem,
  ExamHistoryResponse,
  ExamDetailExam,
  ExamDetailResponse,
  ProjectEvalResult,
  ProjectEvalResponse
};
