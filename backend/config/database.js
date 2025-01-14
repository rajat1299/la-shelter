const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    console.log('Attempting to connect to MongoDB...');
    // Hide password in logs
    const sanitizedUri = process.env.MONGO_URI.replace(/:[^:]*@/, ':****@');
    console.log('MongoDB URI:', sanitizedUri);
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 50,
            minPoolSize: 10,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });

        console.log('MongoDB Connection Object:', {
            host: conn.connection.host,
            name: conn.connection.name,
            readyState: conn.connection.readyState
        });
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Detailed MongoDB connection error:', error);
        logger.error('MongoDB connection error:', error);
        return false;
    }
    return true;
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
});

process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        logger.error('Error closing MongoDB connection:', err);
        process.exit(1);
    }
});

module.exports = connectDB; 