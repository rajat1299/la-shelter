const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const upload = require('../middleware/upload');

// GET /api/listings - Get all listings
router.get('/', listingController.getListings);

// POST /api/listings - Create a new listing
router.post('/', upload.single('image'), listingController.createListing);

// DELETE /api/listings/:id - Delete a listing
router.delete('/:id', listingController.deleteListing);

module.exports = router; 