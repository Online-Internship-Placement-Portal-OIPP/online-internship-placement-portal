import apiClient from './client';

export const internshipsApi = {
  listInternships: (params) => apiClient.get('/internships', { params }),
  getInternships: (params) => apiClient.get('/internships', { params }),
  getMeta: () => apiClient.get('/internships/meta'),
  getInternshipById: (id) => apiClient.get(`/internships/${id}`),
};

export const listInternships = internshipsApi.listInternships;
export const getMeta = internshipsApi.getMeta;

export default internshipsApi;
