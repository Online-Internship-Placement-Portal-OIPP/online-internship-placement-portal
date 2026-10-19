import apiClient from './client';

export const applicationsApi = {
  apply: (internshipId) => apiClient.post('/applications', { internshipId }),
  getMyApplications: () => apiClient.get('/applications'),
};

export default applicationsApi;
