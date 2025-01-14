const rateLimit = require('express-rate-limit');

const createListingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 listings per hour
    message: 'Too many listings created, please try again later'
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per 15 minutes
});

module.exports = {
    createListingLimiter,
    apiLimiter
}; 