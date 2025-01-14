const Listing = require('../models/Listing');
const logger = require('../utils/logger');
const crypto = require('crypto');

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
        logger.info('Creating new listing, body:', req.body);
        logger.info('File:', req.file);

        const { description, contactMethods } = req.body;
        const imageUrl = req.file ? req.file.filename : null;

        // Validate required fields
        if (!description || !imageUrl) {
            logger.error('Missing required fields:', { description: !!description, imageUrl: !!imageUrl });
            return res.status(400).json({ 
                error: 'Description and image are required' 
            });
        }

        const parsedContactMethods = typeof contactMethods === 'string' 
            ? JSON.parse(contactMethods)
            : contactMethods;

        // Validate contact methods
        if (!parsedContactMethods || Object.keys(parsedContactMethods).length === 0) {
            return res.status(400).json({ 
                error: 'At least one contact method is required' 
            });
        }

        // Generate a password for the listing
        const password = generatePassword();

        const listing = new Listing({
            description,
            contactMethods: parsedContactMethods,
            imageUrl: req.file.filename,
            password
        });

        await listing.save();
        res.status(201).json({ 
            success: true, 
            data: {
                listing,
                password // Return the password to the user
            }
        });
    } catch (error) {
        logger.error('Error creating listing:', error);
        res.status(500).json({ error: 'Failed to create listing' });
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