// API Configuration with axios instances
import axios from 'axios';

// Use environment variables in production, fallback to localhost for development
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
let WHATSAPP_URL = import.meta.env.VITE_WHATSAPP_URL || 'http://localhost:3005';

// Force HTTPS in production (fix Mixed Content error)
if (!API_URL.includes('localhost') && API_URL.startsWith('http://')) {
    API_URL = API_URL.replace('http://', 'https://');
}
if (!WHATSAPP_URL.includes('localhost') && WHATSAPP_URL.startsWith('http://')) {
    WHATSAPP_URL = WHATSAPP_URL.replace('http://', 'https://');
}

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
