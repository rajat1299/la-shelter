const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

// ... other imports

// CORS middleware
app.use(cors({
    origin: 'https://lafireshelter.org',
    credentials: true
}));

app.use(express.json());
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to verify reCAPTCHA
const verifyCaptcha = async (req, res, next) => {
    try {
        const token = req.body.recaptchaToken;
        if (!token) {
            return res.status(400).json({ error: 'CAPTCHA verification failed' });
        }

        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
        );

        if (!response.data.success || response.data.score < 0.5) {
            return res.status(400).json({ error: 'CAPTCHA verification failed' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'CAPTCHA verification failed' });
    }
};

// Apply to create listing route
app.post('/api/listings', verifyCaptcha, createListing);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ... rest of your app.js code 