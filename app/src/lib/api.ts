import axios from "axios";
import { getStoredIdToken } from "./session";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
