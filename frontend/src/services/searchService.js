import api from './api';

const searchService = {
  async search(query) {
    const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

export default searchService;
