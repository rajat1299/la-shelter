const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const config = require('./config/config');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const listingRoutes = require('./routes/listingRoutes');
const logger = require('./utils/logger');
const path = require('path');

const app = express();

// Create a stream object for morgan
const morganStream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

// Connect to database with verification
(async () => {
    try {
        await connectDB();
        logger.info('Database connection verified');
        
        // Only start the server if DB connection is successful
        app.use(helmet());
        app.use(cors({
            origin: 'http://localhost:8000', // Frontend URL
            methods: ['GET', 'POST', 'DELETE'],
            allowedHeaders: ['Content-Type']
        }));
        app.use(compression());
        app.use(express.json({ limit: '10mb' }));
        app.use(morgan('combined', { stream: morganStream }));
        app.use(apiLimiter);

        // Serve uploaded files
        app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

        // Routes
        app.use('/api/listings', listingRoutes);

        // Error handling
        app.use(errorHandler);

        // Start server
        const server = app.listen(config.port, () => {
            logger.info(`Server running in ${config.env} mode on port ${config.port}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received. Shutting down gracefully...');
            server.close(() => {
                logger.info('Server closed');
                process.exit(0);
            });
        });

        server.on('error', (error) => {
            console.error('Server error:', error);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
})();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    process.exit(1);
}); 