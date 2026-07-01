import axios from 'axios';

// Local dev sets VITE_API_URL to the backend's own port (cross-origin). In the
// single-Vercel-project deployment, frontend and backend share one domain, so
// VITE_API_URL is intentionally left unset and this resolves to a same-origin
// relative path ("/api") instead of a hardcoded (and wrong, in production) localhost URL.
const baseURL = import.meta.env.VITE_API_URL || '';

const axiosClient = axios.create({ baseURL: `${baseURL}/api` });

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('airbnb_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
    return Promise.reject({ ...error, message });
  }
);

export default axiosClient;
