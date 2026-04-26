import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import orderRoutes from './routes/orders.js';
import ticketRoutes from './routes/tickets.js';

const app = express();

// CORS — whitelist frontend origin (falls back to allow-all in dev)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Rate limiting on auth routes — prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per window per IP
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tickets', ticketRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Server is running ✅' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✅`);
});