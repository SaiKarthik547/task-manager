import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    login: (username: string, password: string) =>
        api.post('/auth/login', { username, password }),
    register: (data: any) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
    getAll: () => api.get('/users'),
    getById: (id: number) => api.get(`/users/${id}`),
    update: (id: number, data: any) => api.patch(`/users/${id}`, data),
    delete: (id: number) => api.delete(`/users/${id}`),
    assignRole: (id: number, roleId: number) => api.post(`/users/${id}/roles`, { roleId }),
    removeRole: (id: number, roleId: number) => api.delete(`/users/${id}/roles/${roleId}`),
};

// Roles API
export const rolesAPI = {
    getAll: () => api.get('/roles'),
    getPermissions: () => api.get('/roles/permissions'),
    getRolePermissions: (id: number) => api.get(`/roles/${id}/permissions`),
    create: (data: any) => api.post('/roles', data),
    update: (id: number, data: any) => api.patch(`/roles/${id}`, data),
    delete: (id: number) => api.delete(`/roles/${id}`),
    assignPermission: (id: number, permissionId: number) =>
        api.post(`/roles/${id}/permissions`, { permissionId }),
    removePermission: (id: number, permissionId: number) =>
        api.delete(`/roles/${id}/permissions/${permissionId}`),
};

// Projects API
export const projectsAPI = {
    getAll: () => api.get('/projects'),
    getById: (id: number) => api.get(`/projects/${id}`),
    create: (data: any) => api.post('/projects', data),
    update: (id: number, data: any) => api.patch(`/projects/${id}`, data),
    delete: (id: number) => api.delete(`/projects/${id}`),
    addMember: (id: number, userId: number, role: string) =>
        api.post(`/projects/${id}/members`, { userId, role }),
    removeMember: (id: number, userId: number) =>
        api.delete(`/projects/${id}/members/${userId}`),
    getTasks: (id: number) => api.get(`/projects/${id}/tasks`),
};

// Tasks API
export const tasksAPI = {
    getAll: () => api.get('/tasks'),
    getById: (id: number) => api.get(`/tasks/${id}`),
    create: (data: any) => api.post('/tasks', data),
    update: (id: number, data: any) => api.patch(`/tasks/${id}`, data),
    delete: (id: number) => api.delete(`/tasks/${id}`),
    getComments: (id: number) => api.get(`/tasks/${id}/comments`),
    addComment: (id: number, comment: string) =>
        api.post(`/tasks/${id}/comments`, { comment }),
};

// Messages API
export const messagesAPI = {
    getConversations: () => api.get('/messages/conversations'),
    getMessages: (conversationId: number) => api.get(`/messages/${conversationId}`),
    createConversation: (recipientId: number) => api.post('/messages', { recipient_id: recipientId, content: "Started a new conversation" }),
};

// Notifications API
export const notificationsAPI = {
    getAll: () => api.get('/notifications'),
    markAsRead: (id: number) => api.patch(`/notifications/${id}/read`),
};
