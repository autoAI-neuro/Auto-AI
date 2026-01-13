// API Configuration with axios instances
import axios from 'axios';

// Use environment variables in production, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WHATSAPP_URL = import.meta.env.VITE_WHATSAPP_URL || 'http://localhost:3005';

// Create axios instance for API calls
const api = axios.create({
    baseURL: API_URL,
});

// Create axios instance for WhatsApp service calls
const whatsappApi = axios.create({
    baseURL: WHATSAPP_URL,
});

export { API_URL, WHATSAPP_URL, api, whatsappApi };
export default api;
