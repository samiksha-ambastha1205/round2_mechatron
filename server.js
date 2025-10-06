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
// Disable default index.html at '/'; we'll control routes explicitly
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// --- PAGE ROUTES ---

// Root should show the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Explicit route for the main page after login
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- API ROUTES ---

/**
 * @route   POST /login
 * @desc    Authenticate an agent based on credentials from environment variables.
 */
app.post('/login', (req, res) => {
    const { agentId, password } = req.body;

    if (!agentId || !password) {
        return res.status(400).json({ success: false, message: 'Team ID and Codeword are required.' });
    }

    // Build the allowlist of valid agent IDs from TEAM_ID_* env vars and optional AGENT_ID
    const validAgentIds = new Set();
    Object.keys(process.env)
        .filter((key) => key.startsWith('TEAM_ID_'))
        .forEach((key) => { if (process.env[key]) validAgentIds.add(process.env[key]); });
    if (process.env.AGENT_ID) validAgentIds.add(process.env.AGENT_ID);

    // Normalize codeword comparison to lowercase for robustness
    const correctCodeword = (process.env.AGENT_CODEWORD || '').toLowerCase();

    const isAgentValid = validAgentIds.has(agentId);
    const isCodewordValid = password.toLowerCase() === correctCodeword;

    if (isAgentValid && isCodewordValid) {
        res.json({ success: true, message: 'Authentication successful.' });
    } else {
        res.status(401).json({ success: false, message: 'Access Denied. Incorrect Credentials.' });
    }
});

// --- SERVE STATIC FILES ---

// A catch-all route: redirect unknown paths to the login page
app.get('*', (req, res) => {
    res.redirect('/');
});

// --- SERVER INITIALIZATION ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('For local development, set AGENT_CODEWORD and any TEAM_ID_* (e.g., TEAM_ID_251=1251) in your .env file. Optionally set AGENT_ID as a single allowed ID.');
});
