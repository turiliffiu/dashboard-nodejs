import api from './api';

const procedureService = {
  async getAll() {
    const response = await api.get('/procedures');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/procedures/${id}`);
    return response.data;
  },

  async download(id) {
    const response = await api.get(`/procedures/${id}/download`, {
      responseType: 'blob',
    });
    return response;
  },
};

export default procedureService;
