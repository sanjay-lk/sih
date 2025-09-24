import axios from 'axios';
export const backend = axios.create({ baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4001' });



