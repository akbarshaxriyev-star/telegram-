import axios from 'axios';

// In production, API is on same domain. In dev, use localhost:5000
const API_BASE = import.meta.env.PROD 
  ? '' 
  : 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE,
});

export default API_BASE;
