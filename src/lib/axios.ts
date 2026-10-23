import axios, { type InternalAxiosRequestConfig } from 'axios';

export const AUTH_TOKEN_KEY = '@kurio:auth_token';
export const AUTH_USER_KEY = '@kurio:auth_user';

export const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach active scenario if specified in query or storage
    const scenario = window.localStorage.getItem('@jungle-nft:scenario');
    if (scenario && config.headers) {
      config.headers.set('X-Scenario', scenario);
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kurio:session-expired'));
    }
    return Promise.reject(error);
  }
);
