import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import contactAdminRoutes from './routes/contactAdminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import paymentAdminRoutes from './routes/paymentAdminRoutes.js';
import dashboardAdminRoutes from './routes/dashboardAdminRoutes.js';
import userAdminRoutes from './routes/userAdminRoutes.js';
import adminNotificationRoutes from './routes/adminNotificationRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { setIO } from './utils/socketEmitter.js';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Debug: Check environment variables
console.log('🔍 Environment variables check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET);

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:8080",
      "https://everestrestaurantcook.vercel.app",
      "https://everestrestaurantcook.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  allowEIO3: true
});

// Set io for socket emitter utility
setIO(io);

// CORS middleware (faqat bitta va to'g'ri joyda)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'https://everestrestaurantglobalcooking.vercel.app',
  'http://localhost:5000',
  'http://localhost:8080',
];
app.use(cors({
  origin: function(origin, callback) {
    // Agar postman yoki serverdan so'rov bo'lsa (origin undefined), ruxsat beramiz
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));


// Fix __dirname for ES modules (must be before any usage)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// WebSocket connection & Admin Management
const activeAdmins = new Map(); // socket.id -> { userId, name, socketId }
const pendingLogins = new Map(); // approvalId -> { userId, name, socketId }
const userSockets = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`🔌 New socket connection: ${socket.id}`);
  
  // Store connection time
  socket.connectedAt = new Date();

  // Handle authentication
  socket.on('authenticate', (data) => {
    try {
      if (data.userId) {
        socket.userId = data.userId;
        socket.userRole = data.role;
        userSockets.set(data.userId, socket.id);
        
        if (data.role === 'admin') {
          activeAdmins.set(data.userId, { 
            socketId: socket.id, 
            userId: data.userId,
            name: data.name,
            connectedAt: new Date()
          });
          socket.join('admins');
          console.log(`👑 Admin ${data.name} (${data.userId}) connected`);
        }
        
        socket.emit('authenticated', { success: true });
        console.log(`✅ User ${data.userId} authenticated`);
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      socket.emit('authentication_error', { message: 'Authentication failed' });
    }
  });

  socket.on('register_admin', (adminId) => {
    try {
      activeAdmins.set(adminId, { 
        socketId: socket.id, 
        userId: adminId,
        connectedAt: new Date()
      });
      socket.join('admins');
      console.log(`👑 Admin ${adminId} registered with socket ${socket.id}`);
    } catch (error) {
      console.error('❌ Admin registration error:', error);
    }
  });
  
  socket.on('register_pending_user', (approvalId) => {
    try {
      if (pendingLogins.has(approvalId)) {
        pendingLogins.get(approvalId).socketId = socket.id;
        console.log(`⏳ Pending user for approvalId ${approvalId} registered with socket ${socket.id}`);
      }
    } catch (error) {
      console.error('❌ Pending user registration error:', error);
    }
  });

  // Handle ping/pong for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date() });
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id}, reason: ${reason}`);
    
    // Remove admin from active list
    for (const [key, value] of activeAdmins.entries()) {
      if (value.socketId === socket.id) {
        activeAdmins.delete(key);
        console.log(`👑 Admin ${key} disconnected and removed from active list`);
        break;
      }
    }
    
    // Remove user from userSockets
    if (socket.userId) {
      userSockets.delete(socket.userId);
      console.log(`👤 User ${socket.userId} disconnected`);
    }
    
    // Clean up pending logins
    for (const [key, value] of pendingLogins.entries()) {
      if (value.socketId === socket.id) {
        pendingLogins.delete(key);
        console.log(`⏳ Pending login ${key} cleaned up`);
        break;
      }
    }
  });
});

// Health check for WebSocket connections
setInterval(() => {
  const connectedClients = io.engine.clientsCount;
  const activeAdminCount = activeAdmins.size;
  console.log(`📊 WebSocket Stats - Connected: ${connectedClients}, Active Admins: ${activeAdminCount}`);
}, 300000); // Every 5 minutes

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/admin/contact', contactAdminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/payments', paymentAdminRoutes);
app.use('/api/admin/dashboard', dashboardAdminRoutes);
app.use('/api/admin/users', userAdminRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    websocket: {
      connected: io !== null,
      clientsCount: io ? io.engine.clientsCount : 0,
      activeAdmins: activeAdmins.size,
      pendingLogins: pendingLogins.size
    }
  });
});

// WebSocket health check endpoint
app.get('/api/websocket/status', (req, res) => {
  const socketStatus = {
    server: {
      running: io !== null,
      clientsCount: io ? io.engine.clientsCount : 0,
      uptime: process.uptime()
    },
    admins: {
      active: activeAdmins.size,
      list: Array.from(activeAdmins.entries()).map(([userId, data]) => ({
        userId,
        name: data.name,
        connectedAt: data.connectedAt,
        socketId: data.socketId
      }))
    },
    pending: {
      count: pendingLogins.size,
      list: Array.from(pendingLogins.entries()).map(([approvalId, data]) => ({
        approvalId,
        userId: data.userId,
        name: data.name,
        socketId: data.socketId
      }))
    }
  };
  
  res.json(socketStatus);
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:8080"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

export { io, activeAdmins, pendingLogins };
