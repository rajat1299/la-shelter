const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('Error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: Object.values(err.errors).map(e => e.message).join(', ')
        });
    }

    if (err.name === 'MulterError') {
        return res.status(400).json({
            error: 'File upload error: ' + err.message
        });
    }

    res.status(500).json({
        error: 'Something went wrong! Please try again.'
    });
};

module.exports = errorHandler; 