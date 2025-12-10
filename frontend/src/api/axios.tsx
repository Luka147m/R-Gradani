import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.DEV
    ? "/api"                                  // dev → Vite proxy → backend
    : "https://r-gradani-backend.onrender.com/api", // prod → direct backend
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;