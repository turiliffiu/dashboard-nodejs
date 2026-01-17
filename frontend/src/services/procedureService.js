import api from './api';

const procedureService = {
  async getAll() {
    const response = await api.get('/procedures');
    return response.data;
  },

  async getById(id) {
    const response = await api.get('/procedures/' + id);
    return response.data;
  },

  async create(formData) {
    const response = await api.post('/procedures', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async update(id, data) {
    const response = await api.put('/procedures/' + id, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete('/procedures/' + id);
    return response.data;
  },

  async download(id) {
    const response = await api.get('/procedures/' + id + '/download', {
      responseType: 'blob',
    });
    return response;
  },
};

export default procedureService;
