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
    const teamId = req.body.teamId ?? req.body.agentId;
    const codeword = req.body.codeword ?? req.body.password;

    if (!teamId || !codeword) {
        return res.status(400).json({ success: false, message: 'Team ID and Codeword are required.' });
    }

    // Build mappings from TEAM_ID_* env vars
    const suffixToValue = {};
    const allIds = new Set();
    Object.keys(process.env)
        .filter((key) => key.startsWith('TEAM_ID_'))
        .forEach((key) => {
            const value = String(process.env[key] || '').trim();
            const suffix = key.substring('TEAM_ID_'.length).trim();
            if (!suffix || !value) return;
            suffixToValue[suffix] = value; // e.g., { '001': '1001' }
            allIds.add(suffix);           // allow entering '001'
            allIds.add(value);            // allow entering '1001'
        });
    if (process.env.AGENT_ID) allIds.add(process.env.AGENT_ID);

    // Determine expected codeword for the provided teamId
    let expectedCodeword = '';
    if (suffixToValue[teamId]) {
        // teamId provided as suffix, e.g., '001' => expect '1001'
        expectedCodeword = suffixToValue[teamId];
    } else {
        // If teamId matches a value (e.g., '1001'), expect the same value as codeword
        const matchesAValue = Object.values(suffixToValue).includes(teamId);
        if (matchesAValue) expectedCodeword = teamId;
    }

    // Fallback: if AGENT_CODEWORD is configured and teamId is in allowlist, accept that too
    const fallbackCodeword = (process.env.AGENT_CODEWORD || '').trim();
    const teamIdIsAllowed = allIds.has(teamId);

    const provided = String(codeword || '');
    const matchesPerTeam = expectedCodeword && provided === expectedCodeword;
    const matchesFallback = fallbackCodeword && teamIdIsAllowed && provided.toLowerCase() === fallbackCodeword.toLowerCase();

    if (matchesPerTeam || matchesFallback) {
        return res.json({ success: true, message: 'Authentication successful.' });
    }
    return res.status(401).json({ success: false, message: 'Access Denied. Incorrect Credentials.' });
});

// --- SERVE STATIC FILES ---

// A catch-all route: redirect unknown paths to the login page
app.get('*', (req, res) => {
    res.redirect('/');
});

// --- SERVER INITIALIZATION ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('For local development, set AGENT_CODEWORD and any TEAM_ID_* (e.g., TEAM_ID_251=1251) in your .env file. Optionally set AGENT_ID as a single allowed ID.');
});
