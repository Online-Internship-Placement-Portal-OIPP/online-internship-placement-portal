import apiClient from './client';

export const progressApi = {
  getProgress: () => apiClient.get('/progress'),
};

export default progressApi;
