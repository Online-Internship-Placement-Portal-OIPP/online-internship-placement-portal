import apiClient from './client';

export const listTests = () => apiClient.get('/tests');
export const getTest = (id) => apiClient.get(`/tests/${id}`);
export const submitTest = (id, answers) => apiClient.post(`/tests/${id}/submit`, { answers });

export const testsApi = {
  listTests,
  getTest,
  submitTest,
  getTests: listTests,
  getTestById: getTest,
  getResults: () => apiClient.get('/results'),
  getResultById: (id) => apiClient.get(`/results/${id}`),
};

export default testsApi;
