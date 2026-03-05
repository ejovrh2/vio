require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Dodaj ovo
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Omogući CORS
app.use(express.static('public'));

// server.js

// Kada netko dođe na http://localhost:3000/ šaljemo ga na login.html
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// 1. LOGIN RUTA
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const params = new URLSearchParams({
        client_id: process.env.AUTH_CLIENT_ID,
        username: username,
        password: password,
        grant_type: 'password'
    });

    try {
        const response = await axios.post(process.env.AUTH_URL, params);
        res.json({
            success: true,
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token
        });
    } catch (error) {
        res.status(401).json({ success: false, message: "Neuspješna prijava." });
    }
});

// 2. REFRESH RUTA
app.post('/api/refresh', async (req, res) => {
    const { refresh_token } = req.body;
    const params = new URLSearchParams({
        client_id: process.env.AUTH_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refresh_token
    });

    try {
        const response = await axios.post(process.env.AUTH_URL, params);
        res.json({
            success: true,
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token
        });
    } catch (error) {
        res.status(401).json({ success: false });
    }
});

// 3. CONFIG RUTA ZA FRONTEND
app.get('/api/config', (req, res) => {
    res.json({
        cesiumToken: process.env.CESIUM_TOKEN,
        dataUrl: process.env.DATA_URL
    });
});
//čevra
app.listen(process.env.PORT || 3000, () => console.log(`Server na http://localhost:${process.env.PORT}`));