import axios from 'axios';

const api = axios.create({
  baseURL: "https://rentease-backend-e7a2.onrender.com", // Backend URL (Node.js server)
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Required for cookies - this handles authentication automatically
});

// Optional: Add request interceptor for debugging only
api.interceptors.request.use(
  (config) => {
    // No need to manually add Authorization headers - cookies handle this
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // You could redirect to login page here if needed
    }
    return Promise.reject(error);
  }
);

export default api;