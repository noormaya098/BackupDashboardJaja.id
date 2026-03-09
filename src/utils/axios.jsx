import axios from "axios";
import { baseUrl } from "@/configs";

// Create an axios instance
const axiosInstance = axios.create({
  baseURL: baseUrl,
});

// Add a request interceptor to include Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Return the response if successful
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      // Clear localStorage to remove expired token
      localStorage.clear();
      // Redirect to SSO login for re-authentication
      window.location.href = "/auth/sso-callback";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;