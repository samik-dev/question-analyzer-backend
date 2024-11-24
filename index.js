const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const validator = require('validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware

// Configure CORS to allow requests only from https://www.testpaper.org
app.use(cors({
    origin: 'https://www.testpaper.org',
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

// Handle preflight OPTIONS request for /fetch-html
app.options('/fetch-html', cors({
    origin: 'https://www.testpaper.org',
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Rate Limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use(limiter);

// API Endpoint to fetch HTML content
app.post('/fetch-html', async (req, res) => {
    const { url } = req.body;

    // Validate the URL format
    if (!url || typeof url !== 'string' || !validator.isURL(url)) {
        return res.status(400).json({ error: 'Invalid URL provided.' });
    }

    // Restrict to ssc.digialm.com domain
    const allowedDomain = 'ssc.digialm.com';
    let hostname;
    try {
        hostname = new URL(url).hostname;
    } catch (error) {
        return res.status(400).json({ error: 'Invalid URL format.' });
    }

    if (hostname !== allowedDomain) {
        return res.status(403).json({ error: `Fetching from ${hostname} is not allowed.` });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            return res.status(response.status).json({ error: `Failed to fetch the URL. Status: ${response.status}` });
        }

        const html = await response.text();
        res.json({ html });
    } catch (error) {
        console.error('Error fetching URL:', error);
        res.status(500).json({ error: 'An error occurred while fetching the URL.' });
    }
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error.' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
