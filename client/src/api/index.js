import axios from 'axios';

// Get API URL from environment or use production fallback
const API_URL = import.meta.env.VITE_API_URL ||
    (window.location.hostname.includes('onrender.com')
        ? 'https://nirin-naming-api.onrender.com/api'
        : 'http://localhost:3000/api');

console.log('[API] Using baseURL:', API_URL);

const API = axios.create({
    baseURL: API_URL,
    timeout: 180000, // 3 minutes timeout for long AI generations
});

export const sendMessage = async (message, history) => {
    try {
        const response = await API.post('/chat', { message, history });
        return response.data.response;
    } catch (error) {
        console.error("API Error in sendMessage:", error);
        throw error;
    }
};

export const checkAvailability = async (name, ncl) => {
    try {
        const response = await API.post('/check-availability', { name, ncl });
        return response.data;
    } catch (error) {
        console.error("API Error in checkAvailability:", error);
        throw error;
    }
};
