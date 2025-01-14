const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    contactMethods: {
        type: Map,
        of: String,
        required: true,
        validate: {
            validator: function(v) {
                return Object.keys(v).length > 0;
            },
            message: 'At least one contact method is required'
        }
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Listing', listingSchema); 