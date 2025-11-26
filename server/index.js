const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const geminiService = require('./services/geminiService');
const instagramService = require('./services/instagramService');
const inpiService = require('./services/inpiService');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration for production
const corsOptions = {
    origin: [
        'http://localhost:5174',
        'http://localhost:5173',
        'https://nirin-naming-app.onrender.com'
    ],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Nirin Naming Assistant API is running' });
});

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        const response = await geminiService.generateResponse(message, history);
        res.json({ response });
    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// Availability Check Endpoint
app.post('/api/check-availability', async (req, res) => {
    try {
        const { name, ncl } = req.body;

        // Run checks in parallel
        const [instagramResult, inpiResult] = await Promise.all([
            instagramService.checkAvailability(name),
            inpiService.checkAvailability(name, ncl)
        ]);

        res.json({
            name,
            instagram: instagramResult,
            inpi: inpiResult
        });
    } catch (error) {
        console.error('Availability Check Error:', error);
        res.status(500).json({ error: 'Failed to check availability' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
