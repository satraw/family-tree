const express = require('express');
const allRoutes = require('./routes/allRoutes');

const app = express();

// Middleware
app.use(express.json());

// CORS setup
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Routes
app.use('/api', allRoutes);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
