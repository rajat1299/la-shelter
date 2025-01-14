# LA Shelter - Emergency Housing Platform

A platform to connect LA residents affected by fires with temporary housing options.

## Features
- Create and manage housing listings
- Image upload functionality
- Contact methods integration
- Secure listing deletion with password protection
- reCAPTCHA v3 protection

## Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
3. Copy .env.example to .env and fill in your values
4. Start the servers:
   ```bash
   # Start backend
   cd backend && npm run dev
   
   # Start frontend
   cd frontend && npm start
   ```

## Environment Variables
See `.env.example` for required environment variables.

## Security
- reCAPTCHA v3 for form protection
- Password-protected listing deletion
- Rate limiting on API endpoints

## License
MIT 