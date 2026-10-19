import apiClient from './client';

export const analysisApi = {
  getAnalysis: () => apiClient.get('/analysis'),
};

export default analysisApi;
