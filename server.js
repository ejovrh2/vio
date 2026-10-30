require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Upozori odmah pri pokretanju ako nešto bitno nedostaje u .env
['AUTH_URL', 'AUTH_CLIENT_ID', 'CESIUM_TOKEN'].forEach(name => {
    if (!process.env[name]) console.warn(`UPOZORENJE: varijabla ${name} nije postavljena u .env`);
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Kada netko dođe na http://localhost:3000/ šaljemo ga na login.html
app.get('/', (req, res) => {
    res.redirect('login.html');
});

// Pretvara grešku servisa za prijavu u odgovor za preglednik
function authError(res, error, defaultMessage) {
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
        // servis je odgovorio, ali je odbio podatke (kriva lozinka, istekao refresh token)
        return res.status(401).json({ success: false, message: defaultMessage });
    }
    // servis za prijavu nije dostupan ili je vratio grešku
    console.error('Greška servisa za prijavu:', error.message);
    return res.status(502).json({ success: false, message: 'Servis za prijavu trenutno nije dostupan. Pokušajte ponovno.' });
}

// 1. LOGIN RUTA
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Unesite korisničko ime i lozinku.' });
    }
    const params = new URLSearchParams({
        client_id: process.env.AUTH_CLIENT_ID,
        username,
        password,
        grant_type: 'password'
    });

    try {
        const response = await axios.post(process.env.AUTH_URL, params, { timeout: 15000 });
        res.json({
            success: true,
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token
        });
    } catch (error) {
        authError(res, error, 'Neispravno korisničko ime ili lozinka.');
    }
});

// 2. REFRESH RUTA
app.post('/api/refresh', async (req, res) => {
    const { refresh_token } = req.body || {};
    if (!refresh_token) return res.status(401).json({ success: false, message: 'Sesija je istekla.' });

    const params = new URLSearchParams({
        client_id: process.env.AUTH_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token
    });

    try {
        const response = await axios.post(process.env.AUTH_URL, params, { timeout: 15000 });
        res.json({
            success: true,
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token
        });
    } catch (error) {
        authError(res, error, 'Sesija je istekla.');
    }
});

// 3. CONFIG RUTA ZA FRONTEND
app.get('/api/config', (req, res) => {
    res.json({
        cesiumToken: process.env.CESIUM_TOKEN,
        dataUrl: process.env.DATA_URL
    });
});

app.listen(PORT, () => console.log(`Server na http://localhost:${PORT}`));
