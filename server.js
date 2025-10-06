const express = require('express');
const cors = require('cors');
const path = require('path');
// Use dotenv to load environment variables from a .env file during development
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
// Enable Cross-Origin Resource Sharing
app.use(cors());
// To parse JSON request bodies
app.use(express.json());
// To serve static files like HTML, CSS, and client-side JS from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- API ROUTES ---

/**
 * @route   POST /login
 * @desc    Authenticate an agent based on credentials from environment variables.
 */
app.post('/login', (req, res) => {
    const { agentId, password } = req.body;

    // Retrieve the correct credentials from environment variables
    const correctAgentId = process.env.TEAM_ID;
    const correctCodeword = process.env.AGENT_CODEWORD;

    if (!agentId || !password) {
        return res.status(400).json({ success: false, message: 'Agent ID and Codeword are required.' });
    }

    // Compare the submitted credentials with the environment variables
    if (agentId === correctAgentId && password.toLowerCase() === correctCodeword) {
        // On successful authentication, send a success response.
        res.json({ success: true, message: 'Authentication successful.' });
    } else {
        // If credentials do not match, send an unauthorized error.
        res.status(401).json({ success: false, message: 'Access Denied. Incorrect Credentials.' });
    }
});

// --- SERVE STATIC FILES ---

// A catch-all route to serve the login.html page for any GET request that doesn't match a static file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// --- SERVER INITIALIZATION ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Ensure you have a .env file with AGENT_ID and AGENT_CODEWORD set for local development.');
});
