const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const seedDatabase = require('./utils/seed');
const { checkMaintenance } = require('./middleware/auth');

// Connect to Database
connectDB().then(() => {
  // Run Database Seeder
  seedDatabase();
});

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all client connections
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
}

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api', apiLimiter);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Maintenance mode checker - applied to all API endpoints
app.use('/api', checkMaintenance);

// Mount API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/geography', require('./routes/geography'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/employee', require('./routes/employee'));
app.use('/api/admin', require('./routes/admin'));

// Fallback Route for non-existing endpoints
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}
