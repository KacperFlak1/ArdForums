# AForums.com

A clean and minimal forum application built with Node.js, Express, and SQLite.

## Features
- User registration and authentication
- Create and view forum posts
- SQLite database for data persistence
- Session-based authentication
- Clean black and white UI

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open your browser to `http://localhost:3000`

## Deployment to Render

### Prerequisites
- A Render account
- Your code pushed to a GitHub repository

### Deployment Steps

1. **Create a new Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure your service:**
   - **Name**: `aforums` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Set Environment Variables:**
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: `your-super-secret-random-string-here`
   - (PORT will be automatically set by Render)

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for the build and deployment to complete

### Important Notes for Render:
- The app uses SQLite with local file storage in the `./data` directory
- Session data is stored in SQLite as well
- Make sure your repository includes all necessary files
- Render will automatically set the PORT environment variable

## Project Structure
```
AForums/
├── server.js          # Main application file
├── package.json       # Dependencies and scripts
├── views/            # EJS templates
│   ├── layout.ejs
│   ├── index.ejs
│   └── post.ejs
├── public/           # Static files
│   ├── css/
│   ├── js/
│   └── uploads/
└── data/            # Database files (created automatically)
```

## Environment Variables
- `NODE_ENV`: Set to `production` for production deployment
- `SESSION_SECRET`: Secret key for session encryption (required in production)
- `PORT`: Server port (automatically set by Render)
