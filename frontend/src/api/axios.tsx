import axios from "axios";

const api = axios.create({
  baseURL: process.env.API_URL, 
  //baseURL: "https://r-gradani-backend.onrender.com", 
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