import apiClient from './client';

export const authApi = {
  login: (credentials) => apiClient.post('/login', credentials),
  register: (userData) => apiClient.post('/register', userData),
};

export default authApi;
