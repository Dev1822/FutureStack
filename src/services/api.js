import axios from 'axios';

// API base URL - uses environment variable or defaults to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token getter function - will be set by the auth hook
let getAuthToken = null;

/**
 * Set the token getter function (called from ClerkProvider context)
 */
export const setAuthTokenGetter = (getter) => {
    getAuthToken = getter;
};

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        if (getAuthToken) {
            try {
                const token = await getAuthToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (error) {
                console.error('Error getting auth token:', error);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Log the error but let the ProtectedRoute component or Clerk handle redirects
            console.error('Unauthorized - 401 response received');
        }
        return Promise.reject(error);
    }
);

/**
 * Opportunity Service - CRUD operations
 */
export const opportunityService = {
    // Get all opportunities for the authenticated user
    getAll: async () => {
        const response = await api.get('/opportunities');
        return response.data;
    },

    // Get a single opportunity by ID
    getById: async (id) => {
        const response = await api.get(`/opportunities/${id}`);
        return response.data;
    },

    // Create a new opportunity
    create: async (data) => {
        const response = await api.post('/opportunities', data);
        return response.data;
    },

    // Update an existing opportunity (partial update)
    update: async (id, data) => {
        const response = await api.patch(`/opportunities/${id}`, data);
        return response.data;
    },

    // Delete an opportunity
    delete: async (id) => {
        const response = await api.delete(`/opportunities/${id}`);
        return response.data;
    }
};

/**
 * Analytics Service
 */
export const analyticsService = {
    // Get analytics data for the authenticated user
    getAnalytics: async () => {
        const response = await api.get('/analytics');
        return response.data;
    }
};

/**
 * Health check
 */
export const healthCheck = async () => {
    const response = await api.get('/health');
    return response.data;
};

export default api;
