import { Course, Batch, Student, Trainer, Examination, NotificationItem, ActivityLog, DashboardStats, ReportData, User } from '../types';

const BASE_URL = '/api';

function getHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem('datapro_auth_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(isFormData),
      ...options.headers,
    },
  });

  const contentType = res.headers.get('content-type');
  let data: any = {};
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  }

  if (!res.ok) {
    const errorMsg = data?.error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const apiService = {
  // Auth
  login: async (identifier: string, password: string) => {
    return request<{ message: string; user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },
  logout: async () => {
    return request<{ message: string }>('/auth/logout', { method: 'POST' });
  },
  getMe: async () => {
    return request<{ user: User }>('/auth/me');
  },
  updateProfile: async (payload: { name: string; email: string; mobile?: string }) => {
    return request<{ message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    return request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    return request<DashboardStats>('/stats/dashboard');
  },

  // Courses
  getCourses: async () => {
    return request<{ courses: Course[] }>('/courses');
  },
  createCourse: async (courseData: Partial<Course>) => {
    return request<{ message: string; id: number }>('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  },
  updateCourse: async (id: number, courseData: Partial<Course>) => {
    return request<{ message: string }>('/courses/' + id, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  },
  deleteCourse: async (id: number) => {
    return request<{ message: string }>('/courses/' + id, { method: 'DELETE' });
  },

  // Batches
  getBatches: async () => {
    return request<{ batches: Batch[] }>('/batches');
  },
  createBatch: async (batchData: Partial<Batch>) => {
    return request<{ message: string; id: number }>('/batches', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
  },
  updateBatch: async (id: number, batchData: Partial<Batch>) => {
    return request<{ message: string }>('/batches/' + id, {
      method: 'PUT',
      body: JSON.stringify(batchData),
    });
  },

  // Trainers
  getTrainers: async () => {
    return request<{ trainers: Trainer[] }>('/trainers');
  },
  createTrainer: async (trainerData: any) => {
    return request<{ message: string; id: number }>('/trainers', {
      method: 'POST',
      body: JSON.stringify(trainerData),
    });
  },
  updateTrainer: async (id: number, trainerData: any) => {
    return request<{ message: string }>('/trainers/' + id, {
      method: 'PUT',
      body: JSON.stringify(trainerData),
    });
  },
  resetTrainerPassword: async (id: number, newPassword: string) => {
    return request<{ message: string }>(`/trainers/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  // Students
  getStudents: async (params?: { search?: string; course_id?: number | string; batch_id?: number | string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.course_id) query.append('course_id', String(params.course_id));
    if (params?.batch_id) query.append('batch_id', String(params.batch_id));
    if (params?.status) query.append('status', params.status);
    return request<{ students: Student[] }>(`/students?${query.toString()}`);
  },
  createStudent: async (studentData: Partial<Student>) => {
    return request<{ message: string; id: number; student_id: string }>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },
  updateStudent: async (id: number, studentData: Partial<Student>) => {
    return request<{ message: string }>('/students/' + id, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },

  // Examinations
  getExaminations: async (params?: {
    course_id?: number | string;
    batch_id?: number | string;
    trainer_id?: number | string;
    status?: string;
    exam_type?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.course_id) query.append('course_id', String(params.course_id));
    if (params?.batch_id) query.append('batch_id', String(params.batch_id));
    if (params?.trainer_id) query.append('trainer_id', String(params.trainer_id));
    if (params?.status) query.append('status', params.status);
    if (params?.exam_type) query.append('exam_type', params.exam_type);
    if (params?.search) query.append('search', params.search);
    return request<{ examinations: Examination[] }>(`/examinations?${query.toString()}`);
  },
  getExaminationById: async (id: string | number) => {
    return request<{ examination: Examination }>(`/examinations/${id}`);
  },
  uploadExamination: async (formData: FormData) => {
    return request<{ message: string; exam_id: string; id: number }>('/examinations', {
      method: 'POST',
      body: formData,
    });
  },
  previewExamination: async (id: string | number) => {
    return request<{ examination: Examination; previewContent: string }>(`/examinations/${id}/preview`);
  },
  updateExamStatus: async (id: number, status: string) => {
    return request<{ message: string }>(`/examinations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
  downloadExamPaper: async (id: string | number, filename: string) => {
    const token = localStorage.getItem('datapro_auth_token');
    const res = await fetch(`${BASE_URL}/examinations/${id}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      throw new Error('Failed to download exam file. Permission denied or file missing.');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Notifications
  getNotifications: async () => {
    return request<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications');
  },
  markNotificationRead: async (id: number) => {
    return request<{ message: string }>(`/notifications/${id}/read`, { method: 'PUT' });
  },
  markAllNotificationsRead: async () => {
    return request<{ message: string }>('/notifications/read-all', { method: 'PUT' });
  },

  // Activity Logs
  getActivityLogs: async (params?: { action?: string; user_role?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.user_role) query.append('user_role', params.user_role);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    return request<{ logs: ActivityLog[] }>(`/activity-logs?${query.toString()}`);
  },

  // Users & Roles
  getUsers: async () => {
    return request<{ users: User[] }>('/users');
  },
  getRoles: async () => {
    return request<{ roles: { id: number; role_name: string }[] }>('/roles');
  },
  createUser: async (userData: any) => {
    return request<{ message: string; id: number }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  updateUserStatus: async (id: number, status: string) => {
    return request<{ message: string }>(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
  resetUserPassword: async (id: number, newPassword: string) => {
    return request<{ message: string }>(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  // Reports
  getReports: async () => {
    return request<ReportData>('/reports');
  },
};
