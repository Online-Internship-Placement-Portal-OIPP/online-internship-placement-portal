import apiClient from './client';

export const testsApi = {
  getTests: () => apiClient.get('/tests'),
  getTestById: (id) => apiClient.get(`/tests/${id}`),
  submitTest: (id, answers) => apiClient.post(`/tests/${id}/submit`, { answers }),
  getResults: () => apiClient.get('/results'),
  getResultById: (id) => apiClient.get(`/results/${id}`),
};

export default testsApi;
