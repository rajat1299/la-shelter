const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const logger = require('./utils/logger');
const mongoose = require('mongoose');
const createListing = require('./controllers/listingController').createListing;
const upload = require('./middleware/upload');

const app = express();

// Log MongoDB connection state
app.use((req, res, next) => {
    console.log('MongoDB Connection State:', mongoose.connection.readyState);
    console.log('Request Path:', req.path);
    next();
});

// CORS middleware
const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.post('/api/listings', verifyCaptcha, upload.single('image'), (req, res, next) => {
    console.log('Handling listing creation...');
    console.log('MongoDB Ready State:', mongoose.connection.readyState);
    createListing(req, res);
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

module.exports = app; 