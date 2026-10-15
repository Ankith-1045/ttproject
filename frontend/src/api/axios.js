
import axios from "axios";

const api = axios.create({
  baseURL: "https://ttproject-backend-kzcq.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
