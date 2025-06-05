const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Importera och använd routerna
const authRoutes = require('./routes/auth');
const carRoutes = require('./routes/cars');
const rentalRoutes = require('./routes/rentals');

// Importera authenticateToken från middleware-filen
const authenticateToken = require('./middleware/authMiddleware');

// Ladda miljövariabler
dotenv.config();

// Initiera Express-appen
const app = express();

// Middleware
// Aktivera CORS
app.use(cors({
    origin: 'http://localhost:3000', // Tillåt endast frontend-domänen
    credentials: true,
}));
app.use(express.json());

// Anslut till MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.',
});

// Använd routerna
app.use('/api', limiter);
app.use('/api/auth', authRoutes);
app.use('/api/cars', authenticateToken, carRoutes); // Skydda routes med JWT
app.use('/api/rentals', authenticateToken, rentalRoutes); // Skydda routes med JWT|


// Starta servern
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));