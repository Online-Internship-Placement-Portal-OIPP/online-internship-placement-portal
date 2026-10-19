import apiClient from './client';

export const adminApi = {
  // Internships
  createInternship: (data) => apiClient.post('/admin/internships', data),
  updateInternship: (id, data) => apiClient.put(`/admin/internships/${id}`, data),
  deleteInternship: (id) => apiClient.delete(`/admin/internships/${id}`),

  // Tests
  getAdminTests: () => apiClient.get('/admin/tests'),
  getAdminTestById: (id) => apiClient.get(`/admin/tests/${id}`),
  createTest: (data) => apiClient.post('/admin/tests', data),
  updateTest: (id, data) => apiClient.put(`/admin/tests/${id}`, data),
  deleteTest: (id) => apiClient.delete(`/admin/tests/${id}`),

  // Questions
  createQuestion: (testId, data) => apiClient.post(`/admin/tests/${testId}/questions`, data),
  updateQuestion: (questionId, data) => apiClient.put(`/admin/questions/${questionId}`, data),
  deleteQuestion: (questionId) => apiClient.delete(`/admin/questions/${questionId}`),
};

export default adminApi;
