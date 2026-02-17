import axios from 'axios';

const API = axios.create({ baseURL: "http://localhost:5000/api/auth" });

export const login = (data) => API.post('/login', data); // Hits backend login route
export const register = (data) => API.post('/register', data); // Hits backend register route