const API_BASE_URL = 'http://localhost:3000/api';
const BACKEND_URL = 'http://localhost:3000';
const RECAPTCHA_SITE_KEY = '6LebF7cqAAAAAHROwzDk3ng8KTndqIG2TDwdKotT';

export { BACKEND_URL, api };

const api = {
    async createListing(formData) {
        try {
            // Get reCAPTCHA token
            const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, {action: 'create_listing'});
            formData.append('recaptchaToken', token);
            
            const response = await fetch(`${API_BASE_URL}/listings`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create listing');
            }
            
            return data;
        } catch (error) {
            console.error('Error creating listing:', error);
            throw new Error(error.message || 'Failed to create listing');
        }
    },

    async getListings() {
        try {
            const response = await fetch(`${API_BASE_URL}/listings`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching listings:', error);
            throw error;
        }
    },

    async deleteListing(id, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/listings/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting listing:', error);
            throw error;
        }
    }
}; 