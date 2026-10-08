import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import apiRoutes from './routes/index.js';
import { testConnection } from './db/pool.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow development frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api', apiRoutes);

// Serve built frontend assets if dist folder exists
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'Warehouse & Inventory Management API',
      version: '1.0.0',
      status: 'online',
      endpoints: [
        '/api/dashboard',
        '/api/warehouses',
        '/api/products',
        '/api/inventory',
        '/api/transfers',
        '/api/transport-vehicles',
        '/api/analytics'
      ]
    });
  });
}

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Warehouse Management Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server due to database connection error:', error.message);
    process.exit(1);
  }
}

startServer();

export default app;
