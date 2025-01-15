const Listing = require('../models/Listing');
const logger = require('../utils/logger');
const crypto = require('crypto');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// Function to generate a random password
const generatePassword = () => {
    return crypto.randomBytes(4).toString('hex');
};

exports.getListings = async (req, res) => {
    try {
        const listings = await Listing.find().sort({ createdAt: -1 });
        // Transform the listings to handle Map objects
        const transformedListings = listings.map(listing => ({
            _id: listing._id,
            description: listing.description,
            imageUrl: listing.imageUrl,
            contactMethods: Object.fromEntries(listing.contactMethods),
            createdAt: listing.createdAt
        }));
        res.json(transformedListings);
    } catch (error) {
        logger.error('Error fetching listings:', error);
        res.status(500).json({ error: 'Failed to fetch listings' });
    }
};

exports.createListing = async (req, res) => {
    try {
        console.log('Starting createListing...');
        console.log('MongoDB Connection State:', mongoose.connection.readyState);
        // Debug logging
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        console.log('Contact Methods:', typeof req.body.contactMethods);

        const { description, contactMethods } = req.body;
        let imageUrl = null;

        // Upload to Cloudinary if file exists
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'lashelter',
                resource_type: 'auto'
            });
            imageUrl = result.secure_url;
            
            // Clean up local file
            fs.unlinkSync(req.file.path);
        }

        // Validate required fields
        if (!description || !imageUrl) {
            console.log('Missing fields:', { description: !!description, imageUrl: !!imageUrl });
            return res.status(400).json({ 
                error: 'Description and image are required' 
            });
        }

        const parsedContactMethods = typeof contactMethods === 'string' 
            ? JSON.parse(contactMethods)
            : contactMethods;

        // Validate contact methods
        if (!parsedContactMethods || Object.keys(parsedContactMethods).length === 0) {
            console.log('Invalid contact methods:', parsedContactMethods);
            return res.status(400).json({ 
                error: 'At least one contact method is required' 
            });
        }

        // Generate a password for the listing
        const password = generatePassword();

        const listing = new Listing({
            description,
            contactMethods: parsedContactMethods,
            imageUrl: imageUrl,
            password
        });

        await listing.save();
        res.status(201).json({ 
            success: true, 
            data: {
                listing,
                password
            }
        });
    } catch (error) {
        console.error('Full error:', error);
        logger.error('Error creating listing:', error);
        res.status(500).json({ error: 'Failed to create listing', details: error.message });
    }
};

exports.deleteListing = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (listing.password !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        await listing.deleteOne();
        res.json({ success: true });
    } catch (error) {
        logger.error('Error deleting listing:', error);
        res.status(500).json({ error: 'Failed to delete listing' });
    }
}; 