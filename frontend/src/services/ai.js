import request from './api';

export const aiAPI = {
  chat: ({ message, history = [] }) =>
    request('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};

export default aiAPI;