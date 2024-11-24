const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Allow only POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
    }

    // Set CORS headers to allow requests from https://www.testpaper.org
    res.setHeader('Access-Control-Allow-Origin', 'https://www.testpaper.org');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url } = req.body;

    // Validate the URL
    if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'Invalid URL provided.' });
        return;
    }

    // Validate URL format and domain
    let hostname;
    try {
        const urlObj = new URL(url);
        hostname = urlObj.hostname;
        if (hostname !== 'ssc.digialm.com') {
            res.status(403).json({ error: `Fetching from ${hostname} is not allowed.` });
            return;
        }
    } catch (error) {
        res.status(400).json({ error: 'Invalid URL format.' });
        return;
    }

    try {
        const response = await fetch(url, {
            redirect: 'follow', // Follow redirects
            timeout: 10000, // 10 seconds timeout
        });

        if (!response.ok) {
            res.status(response.status).json({ error: `Failed to fetch the URL. Status: ${response.status}` });
            return;
        }

        const html = await response.text();
        res.status(200).json({ html });
    } catch (error) {
        console.error('Error fetching URL:', error);
        res.status(500).json({ error: 'An error occurred while fetching the URL.' });
    }
};
