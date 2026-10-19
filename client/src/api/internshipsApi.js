import apiClient from './client';

export const internshipsApi = {
  getInternships: (params) => apiClient.get('/internships', { params }),
  getMeta: () => apiClient.get('/internships/meta'),
  getInternshipById: (id) => apiClient.get(`/internships/${id}`),
};

export default internshipsApi;
