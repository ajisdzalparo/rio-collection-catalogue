const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000/api/';

export const env = {
  apiUrl,
  backendUrl
};
