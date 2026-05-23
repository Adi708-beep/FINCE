import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import invoiceRoutes from './routes/invoices.js';
import budgetRoutes from './routes/budgets.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import alertRoutes from './routes/alerts.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity, can narrow down later
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve uploads folder static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach socket.io to req object for route access
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User joins their private channel room on login
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined user channel: ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Setup API Routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/alerts', alertRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'FINCE API Server is running successfully.' });
});

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fince';
console.log('Attempting to connect to MongoDB at:', MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    
    // Start Server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`FINCE Backend Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed! Server cannot start.', err);
    process.exit(1);
  });
