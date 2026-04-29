import request from './api';

export const aiAPI = {
  chat: ({ message, history = [] }) =>
    request('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  analyzeDocument: (data) =>
    request('/api/v1/ai/analyze-document', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  moderateImage: (imageUrl) =>
    request('/api/v1/ai/moderate-image', {
      method: 'POST',
      body: JSON.stringify({ image_url: imageUrl }),
    }),

  analyzeReclamation: (data) =>
    request('/api/v1/ai/analyze-reclamation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export default aiAPI;