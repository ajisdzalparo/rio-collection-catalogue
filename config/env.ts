const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000/api/';
const velomockUrl =
  process.env.NEXT_PUBLIC_VELOMOCK_URL ||
  'https://velomock-staging.ajisdzalparo.com/api/mock/rio-collection';
const velomockToken =
  process.env.VELOMOCK_API_TOKEN || 'FFbWRhJfvkGAaLas6u8n_uK8S7T5nEP6PJhCxbtHNTA';
const rajaongkirApiKey = process.env.RAJAONGKIR_API_KEY || '';
const recaptchaSiteKey =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export const env = {
  apiUrl,
  backendUrl,
  velomockUrl,
  velomockToken,
  rajaongkirApiKey,
  recaptchaSiteKey
};
