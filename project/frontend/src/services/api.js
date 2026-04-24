import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const message =
      err.response?.data?.errors?.[0] ||
      err.response?.data?.error ||
      err.response?.data?.message ||
      'Ошибка сети. Попробуйте ещё раз.';
    return Promise.reject(new Error(message));
  }
);

export const authService = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
};

export const jobService = {
  getAll: () => api.get('/jobs').then(r => r.data),
  getOne: (id) => api.get(`/jobs/${id}`).then(r => r.data),
  create: (data) => api.post('/jobs', data).then(r => r.data),
  update: (id, data) => api.put(`/jobs/${id}`, data).then(r => r.data),
  apply: (id) => api.post(`/jobs/${id}/apply`).then(r => r.data),
  cancelApply: (id) => api.delete(`/jobs/${id}/apply`).then(r => r.data),
  myApplications: () => api.get('/jobs/my/applications').then(r => r.data),
  myPostings: () => api.get('/jobs/my/postings').then(r => r.data),
};

export const scheduleService = {
  getAll: (params) => api.get('/schedule', { params }).then(r => r.data),
  getMy: () => api.get('/schedule/my').then(r => r.data),
  create: (data) => api.post('/schedule', data).then(r => r.data),
  update: (id, data) => api.put(`/schedule/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/schedule/${id}`).then(r => r.data),
  enroll: (id) => api.post(`/schedule/${id}/enroll`).then(r => r.data),
  unenroll: (id) => api.delete(`/schedule/${id}/enroll`).then(r => r.data),
};

export const employerService = {
  getAll: () => api.get('/employers').then(r => r.data),
  create: (data) => api.post('/employers', data).then(r => r.data)
};

export const studentService = {
  getAll: () => api.get('/students').then(r => r.data),
  create: (data) => api.post('/students', data).then(r => r.data)
};

export default api;

export const adminService = {
  getStats: () => api.get('/admin/stats').then(r => r.data),
  getUsers: () => api.get('/admin/users').then(r => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then(r => r.data),
  changeRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }).then(r => r.data),
  getJobs: () => api.get('/admin/jobs').then(r => r.data),
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`).then(r => r.data),
  toggleJob: (id) => api.put(`/admin/jobs/${id}/toggle`).then(r => r.data),
  removeApplicant: (jobId, userId) => api.delete(`/admin/jobs/${jobId}/applicant/${userId}`).then(r => r.data),
  getSchedule: () => api.get('/admin/schedule').then(r => r.data),
  deleteSlot: (id) => api.delete(`/admin/schedule/${id}`).then(r => r.data),
  removeStudent: (slotId, userId) => api.delete(`/admin/schedule/${slotId}/student/${userId}`).then(r => r.data),
};

export const profileService = {
  update: (data) => api.put('/auth/profile', data).then(r => r.data),
};
