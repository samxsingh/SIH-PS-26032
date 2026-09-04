import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Human-readable error formatting
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let userMessage = 'Something went wrong while connecting to the service. Please try again.';
    const customErr = new Error(userMessage);

    if (error.response) {
      const serverError = error.response.data?.error;
      if (serverError && serverError.message) {
        userMessage = serverError.message;
      } else if (error.response.status === 401) {
        userMessage = 'Your session has expired or is invalid. Please log in again.';
      } else if (error.response.status === 403) {
        userMessage = 'You do not have permission to access this resource.';
      } else if (error.response.status === 404) {
        userMessage = 'The requested resource was not found.';
      } else if (error.response.status >= 500) {
        userMessage = 'The government server encountered a temporary issue. Please try again shortly.';
      }

      customErr.message = userMessage;
      customErr.code = serverError?.code;
      customErr.details = serverError?.details;
      customErr.status = error.response.status;
      customErr.response = error.response;
    } else if (error.request) {
      customErr.message = 'Unable to reach the procurement server. Please check your internet connection.';
    }

    return Promise.reject(customErr);
  }
);

export default apiClient;
