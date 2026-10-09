export const API_BASE_URL = (import.meta.env.DEV
  ? (import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:4000/api')
  : (import.meta.env.VITE_API_URL || '')).replace(/\/+$/, '');
const TOKEN_KEY = 'freelancer_az_token';
const publicCache = new Map();
const publicRequests = new Map();
const PUBLIC_CACHE_TTL = 15000;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function getApiHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  const data = await response.json().catch(() => null);
  if (!response.ok && !data) throw new Error(`Backend statusu alınmadı (${response.status}).`);
  return data;
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const cacheKey = `${method}:${path}`;
  if (method === 'GET' && !auth) {
    const cached = publicCache.get(cacheKey);
    if (cached && Date.now() - cached.time < PUBLIC_CACHE_TTL) return cached.data;
    if (publicRequests.has(cacheKey)) return publicRequests.get(cacheKey);
  }
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res;
  const fetchRequest = (async () => {
   try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
   } catch (err) {
    throw new Error(import.meta.env.DEV
      ? 'Serverə qoşulmaq mümkün olmadı. Backend işə salındığından əmin olun (npm run server).'
      : 'Backend ünvanına qoşulmaq mümkün olmadı. VITE_API_URL dəyərini yoxlayın.');
   }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : null;
   if (!res.ok) {
    throw new Error((data && data.error) || `Xəta baş verdi (${res.status})`);
   }
   return data;
  })();
  if (method === 'GET' && !auth) {
    publicRequests.set(cacheKey, fetchRequest);
    try {
      const data = await fetchRequest;
      publicCache.set(cacheKey, { data, time: Date.now() });
      return data;
    } finally {
      publicRequests.delete(cacheKey);
    }
  }
  return fetchRequest;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  getProfile: () => request('/profile'),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: payload }),
  updateProfileMedia: (field, url) => request('/profile/media', { method: 'PATCH', body: { field, url } }),
  getSpecialties: () => request('/profile/specialties'),
  addSpecialty: (payload) => request('/profile/specialties', { method: 'POST', body: payload }),
  updateSpecialty: (id, payload) => request(`/profile/specialties/${id}`, { method: 'PUT', body: payload }),
  deleteSpecialty: (id) => request(`/profile/specialties/${id}`, { method: 'DELETE' }),
  getWorkExperiences: () => request('/profile/experiences'),
  addWorkExperience: (payload) => request('/profile/experiences', { method: 'POST', body: payload }),
  updateWorkExperience: (id, payload) => request(`/profile/experiences/${id}`, { method: 'PUT', body: payload }),
  deleteWorkExperience: (id) => request(`/profile/experiences/${id}`, { method: 'DELETE' }),
  getCertificates: () => request('/profile/certificates'),
  addCertificate: (payload) => request('/profile/certificates', { method: 'POST', body: payload }),
  updateCertificate: (id, payload) => request(`/profile/certificates/${id}`, { method: 'PUT', body: payload }),
  deleteCertificate: (id) => request(`/profile/certificates/${id}`, { method: 'DELETE' }),

  getTasks: (params = {}) => request(`/tasks?${new URLSearchParams(params).toString()}`, { auth: false }),
  getMyTasks: () => request('/tasks/mine'),
  getTask: (id) => request(`/tasks/${id}`),
  createTask: (payload) => request('/tasks', { method: 'POST', body: payload }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  applyToTask: (id, message, price, priceType, deliveryDays) => request(`/tasks/${id}/apply`, { method: 'POST', body: { message, price, priceType, deliveryDays } }),
  getMyApplications: () => request('/tasks/applications/mine'),
  getLikedApplications: () => request('/tasks/liked/applications'),
  getDashboardTasks: () => request('/tasks/dashboard/mine'),
  acceptApplication: (taskId, appId) => request(`/tasks/${taskId}/applications/${appId}/accept`, { method: 'POST' }),
  replyToApplication: (taskId, appId, text, parentId) => request(`/tasks/${taskId}/applications/${appId}/replies`, { method: 'POST', body: { text, parentId } }),
  updateApplicationReply: (taskId, appId, replyId, text) => request(`/tasks/${taskId}/applications/${appId}/replies/${replyId}`, { method: 'PATCH', body: { text } }),
  deleteApplicationReply: (taskId, appId, replyId) => request(`/tasks/${taskId}/applications/${appId}/replies/${replyId}`, { method: 'DELETE' }),
  updateApplication: (taskId, appId, payload) => request(`/tasks/${taskId}/applications/${appId}`, { method: 'PATCH', body: payload }),
  likeApplication: (taskId, appId) => request(`/tasks/${taskId}/applications/${appId}/like`, { method: 'POST' }),
  deleteApplication: (taskId, appId) => request(`/tasks/${taskId}/applications/${appId}`, { method: 'DELETE' }),
  updateTaskStatus: (id, status) => request(`/tasks/${id}/status`, { method: 'POST', body: { status } }),
  reviewTask: (id, payload) => request(`/tasks/${id}/reviews`, { method: 'POST', body: payload }),

  getFreelancers: () => request('/users/freelancers', { auth: false }),
  getUser: (id) => request(`/users/${id}`, { auth: false }),

  getConversations: () => request('/messages/conversations'),
  getThread: (userId) => request(`/messages/${userId}`),
  sendMessage: (toUserId, text, attachment = null) => request('/messages', { method: 'POST', body: { toUserId, text, attachment } }),
  getBlockStatus: (userId) => request(`/messages/${userId}/block-status`),
  blockUser: (userId) => request(`/messages/${userId}/block`, { method: 'POST' }),
  unblockUser: (userId) => request(`/messages/${userId}/block`, { method: 'DELETE' }),

  getProjects: (params = {}) => request(`/projects?${new URLSearchParams(params).toString()}`),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (payload) => request('/projects', { method: 'POST', body: payload }),
  likeProject: (id) => request(`/projects/${id}/like`, { method: 'POST' }),
  getLikedProjects: () => request('/projects/liked'),
  getLikedProjectComments: () => request('/projects/liked/comments'),
  addProjectComment: (id, text, parentId = null) => request(`/projects/${id}/comments`, { method: 'POST', body: { text, parentId } }),
  updateProjectComment: (id, commentId, text) => request(`/projects/${id}/comments/${commentId}`, { method: 'PATCH', body: { text } }),
  deleteProjectComment: (id, commentId) => request(`/projects/${id}/comments/${commentId}`, { method: 'DELETE' }),
  likeProjectComment: (id, commentId) => request(`/projects/${id}/comments/${commentId}/like`, { method: 'POST' }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  getCategories: () => request('/categories', { auth: false }),
  addCategory: async (name) => {
    const result = await request('/categories', { method: 'POST', body: { name } });
    publicCache.delete('GET:/categories');
    return result;
  },
  getClubPosts: (search = '') => request(`/club?search=${encodeURIComponent(search)}`, { auth: false }),
  getClubPost: (id) => request(`/club/${id}`, { auth: false }),
  createClubPost: (payload) => request('/club', { method: 'POST', body: payload }),
  deleteClubPost: (id) => request(`/club/${id}`, { method: 'DELETE' }),
  addClubComment: (id, text) => request(`/club/${id}/comments`, { method: 'POST', body: { text } }),
  updateClubComment: (id, commentId, text) => request(`/club/${id}/comments/${commentId}`, { method: 'PATCH', body: { text } }),
  deleteClubComment: (id, commentId) => request(`/club/${id}/comments/${commentId}`, { method: 'DELETE' }),
  submitSupport: (payload) => request('/support', { method: 'POST', body: payload, auth: false }),
  getNotifications: () => request('/notifications'),
  markNotificationsRead: () => request('/notifications/read', { method: 'POST' }),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
  getSocialLinks: () => request('/social/links'),
  saveSocialLinks: (payload) => request('/social/links', { method: 'PUT', body: payload }),
  updateOnlineStatus: (isOnline) => request('/social/status', { method: 'PUT', body: { isOnline } }),
  getOnlineStatus: (id) => request(`/social/status/${id}`, { auth: false }),
  uploadMedia: (file) => {
    if (!file) return Promise.reject(new Error('Yükləmək üçün fayl seçin.'));
    if (file.size > 50 * 1024 * 1024) return Promise.reject(new Error('Fayl ölçüsü 50 MB-dan böyük ola bilməz.'));
    const body = new FormData();
    body.append('file', file);
    return request('/uploads/media', { method: 'POST', body });
  },
};

export { setToken as setAuthToken, getToken as getAuthToken };
