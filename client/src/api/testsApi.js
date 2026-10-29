import apiClient from './client';

export const listTests = () => apiClient.get('/tests');
export const getTest = (id) => apiClient.get(`/tests/${id}`);
export const submitTest = (id, answers) => apiClient.post(`/tests/${id}/submit`, { answers });

// Results API
export const listResults = () => apiClient.get('/results');
export const getResult = (id) => apiClient.get(`/results/${id}`);

export const testsApi = {
  listTests,
  getTest,
  submitTest,
  getTests: listTests,
  getTestById: getTest,
  // Point stub keys at the real named implementations
  getResults: listResults,
  getResultById: getResult,
  listResults,
  getResult,
};

export default testsApi;
