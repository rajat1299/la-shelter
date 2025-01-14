import { api, BACKEND_URL } from './services/api.js';

// Utility functions
const showToast = (message, duration = 3000) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    toast.offsetHeight; // Force reflow
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

const validateListing = (imageFile, description, contactMethods) => {
    const errors = {};
    
    // Validate image
    if (!imageFile) {
        errors.image = 'Please select an image';
    } else if (!imageFile.type.startsWith('image/')) {
        errors.image = 'Please select a valid image file';
    } else if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
        errors.image = 'Image size should be less than 5MB';
    }
    
    // Validate description
    if (!description.trim()) {
        errors.description = 'Description is required';
    } else if (description.length < 50) {
        errors.description = 'Description should be at least 50 characters';
    }
    
    // Validate contact methods
    if (Object.keys(contactMethods).length === 0) {
        errors.contact = 'At least one contact method is required';
    }
    
    return errors;
};

// Utility functions for icons
const getContactIcon = (method) => {
    const icons = {
        email: 'fa-regular fa-envelope',
        phone: 'fa-solid fa-phone',
        whatsapp: 'fa-brands fa-whatsapp',
        telegram: 'fa-brands fa-telegram',
        twitter: 'fa-brands fa-twitter',
        instagram: 'fa-brands fa-instagram',
        facebook: 'fa-brands fa-facebook',
        wechat: 'fa-brands fa-weixin',
        messenger: 'fa-brands fa-facebook-messenger'
    };
    return icons[method] || 'fa-solid fa-circle-info';
};

// Listing functions
async function createListing(imageFile, description, contactMethods) {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('description', description);
        formData.append('contactMethods', JSON.stringify(contactMethods));
        
        const response = await api.createListing(formData);
        if (response.success) {
            showToast('Listing created successfully!');
            return response.data.password;
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        showToast('Failed to create listing: ' + error.message);
        throw error;
    }
}

async function displayListings() {
    const container = document.getElementById('listings-container');
    if (!container) return;
    
    container.classList.add('loading');
    
    try {
        const listings = await api.getListings();
        
        if (!listings || listings.length === 0) {
            container.innerHTML = `
                <div class="listing" style="text-align: center;">
                    <p>No listings available yet. Be the first to create one!</p>
                    <a href="create-listing.html" class="btn">Create Listing</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = listings.map(listing => `
            <div class="listing" data-id="${listing._id}">
                <div class="listing-image">
                    <img src="${listing.imageUrl.startsWith('http') ? listing.imageUrl : `${BACKEND_URL}/uploads/${listing.imageUrl}`}" alt="Shelter Image"
                         onerror="this.src='/images/placeholder.jpg'">
                </div>
                <div class="listing-content">
                    <div class="listing-meta">
                        <span class="listing-date">${new Date(listing.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="listing-description">${listing.description}</div>
                    <div class="contact-info">
                        <div class="contact-methods">
                            ${Object.entries(listing.contactMethods).map(([method, value]) => `
                                <div class="contact-method">
                                    <i class="${getContactIcon(method)}"></i>
                                    <span class="contact-value">${value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="listing-actions">
                        <button class="btn-bracket" onclick="event.stopPropagation(); showDeleteModal('${listing._id}')">
                            delete listing
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers to listings after rendering
        document.querySelectorAll('.listing').forEach(listing => {
            listing.addEventListener('click', () => {
                const listingData = listings.find(l => l._id === listing.dataset.id);
                if (listingData) {
                    showListingModal(listingData);
                }
            });
            listing.style.cursor = 'pointer';
        });
        
    } catch (error) {
        console.error('Error displaying listings:', error);
        container.innerHTML = `
            <div class="listing" style="text-align: center;">
                <p>Failed to load listings. Please refresh the page.</p>
            </div>
        `;
    } finally {
        container.classList.remove('loading');
    }
}

// Delete handling functions
let currentDeletingId = null;

function showDeleteModal(listingId) {
    currentDeletingId = listingId;
    const modal = document.getElementById('delete-modal');
    const passwordInput = document.getElementById('delete-password');
    passwordInput.value = '';
    modal.classList.add('show');
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    modal.classList.remove('show');
    currentDeletingId = null;
}

async function confirmDelete() {
    if (!currentDeletingId) return;
    
    const passwordInput = document.getElementById('delete-password');
    const password = passwordInput.value;
    
    if (!password) {
        showToast('Please enter the password');
        return;
    }
    
    try {
        const response = await api.deleteListing(currentDeletingId, password);
        if (response.success) {
            showToast('Listing deleted successfully');
            closeDeleteModal();
            displayListings(); // Refresh the listings
        } else {
            throw new Error(response.error || 'Failed to delete listing');
        }
    } catch (error) {
        showToast(error.message);
    }
}

// Form handling
function initializeForm() {
    const form = document.getElementById('listing-form');
    if (!form) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const descriptionField = form.querySelector('#description');
    const characterCount = form.querySelector('.character-count');
    const imageInput = form.querySelector('#image');
    const imagePreview = document.getElementById('image-preview');
    
    // Add character counter
    if (descriptionField && characterCount) {
        descriptionField.addEventListener('input', () => {
            const length = descriptionField.value.length;
            characterCount.textContent = `${length}/50 characters`;
            characterCount.style.color = length < 50 ? '#dc3545' : '#28a745';
        });
    }
    
    // Handle image preview
    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', () => {
            const file = imageInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.innerHTML = '';
                imagePreview.style.display = 'none';
            }
        });
    }
    
    // Clear validation errors when input changes
    form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('input-error');
            const errorElement = input.parentElement.querySelector('.error');
            if (errorElement) {
                errorElement.remove();
            }
        });
    });
    
    form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const description = form.querySelector('#description').value;
    
    // Collect contact methods
    const contactMethods = {};
    form.querySelectorAll('[name^="contactMethods["]').forEach(input => {
        if (input.value) {
            const key = input.name.match(/\[(.*?)\]/)[1];
            contactMethods[key] = input.value;
        }
    });
    
    // Validate at least one contact method
    if (Object.keys(contactMethods).length === 0) {
        showToast('Please provide at least one contact method');
        return;
    }
    
    try {
        const formData = new FormData(form);
        // Remove individual contact method fields and add as single JSON
        form.querySelectorAll('[name^="contactMethods["]').forEach(input => {
            formData.delete(input.name);
        });
        formData.append('contactMethods', JSON.stringify(contactMethods));
        
        // Show loading state
        form.classList.add('loading');
        submitBtn.disabled = true;
        
        const response = await api.createListing(formData);
        
        if (response.success) {
            // Show the password to the user
            alert(`Your listing has been created! Please save this password to delete your listing later: ${response.data.password}`);
            
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            throw new Error(response.error || 'Failed to create listing');
        }
    } catch (error) {
        showToast(error.message);
    } finally {
        form.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    if (document.getElementById('listings-container')) {
        displayListings();
    }
});

// Export functions that need to be globally available
window.showDeleteModal = showDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;

// Make the function globally available
window.fillDescriptionTemplate = fillDescriptionTemplate;

function scrollToListings() {
    const listingsContainer = document.getElementById('listings-container');
    if (listingsContainer) {
        listingsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Make function globally available
window.scrollToListings = scrollToListings;

// Modal functions
function showListingModal(listing) {
    const modal = document.getElementById('listing-modal');
    const image = modal.querySelector('.modal-image img');
    const description = modal.querySelector('.modal-description');
    const contactMethods = modal.querySelector('.modal-contact-methods');
    const date = modal.querySelector('.modal-date');
    
    // Set content
    image.src = listing.imageUrl.startsWith('http') 
        ? listing.imageUrl 
        : `${BACKEND_URL}/uploads/${listing.imageUrl}`;
    image.onerror = () => image.src = '/images/placeholder.jpg';
    
    description.textContent = listing.description;
    
    // Format contact methods
    contactMethods.innerHTML = Object.entries(listing.contactMethods)
        .map(([method, value]) => `
            <div class="contact-method">
                <i class="${getContactIcon(method)}"></i>
                <span class="contact-value">${value}</span>
            </div>
        `).join('');
    
    date.textContent = `Posted on ${new Date(listing.createdAt).toLocaleDateString()}`;
    
    // Show modal
    modal.classList.add('show');
    
    // Set up close handlers
    const closeModal = () => modal.classList.remove('show');
    
    const closeButton = modal.querySelector('.close-modal');
    closeButton.onclick = closeModal;
    
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

// Make functions globally available
window.showDeleteModal = showDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.showListingDetail = (listing) => showListingModal(listing); 