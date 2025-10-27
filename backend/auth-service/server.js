/**
 * Axis-Guardian Authentication Service
 *
 * Simple JWT-based authentication for production deployment
 * Provides login/logout and token validation endpoints
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const { createClient } = require('redis');
require('dotenv').config({ path: '../../.env.production' });

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3000;

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'surveillance',
  user: process.env.POSTGRES_USER || 'axis_guardian_prod',
  password: process.env.POSTGRES_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Redis client for session storage
let redisClient;
const initRedis = async () => {
  try {
    redisClient = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    });

    await redisClient.connect();
    console.log('✓ Connected to Redis');
  } catch (error) {
    console.warn('⚠ Redis not available, using in-memory session storage');
    redisClient = null;
  }
};

// Initialize database schema
const initDatabase = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    );
  `;

  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      token VARCHAR(500) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createUsersTable);
    await pool.query(createSessionsTable);
    console.log('✓ Database schema initialized');

    // Create default admin user if it doesn't exist
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'CHANGE_THIS_STRONG_PASSWORD';

    const userExists = await pool.query('SELECT id FROM users WHERE username = $1', [adminUsername]);

    if (userExists.rows.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        [adminUsername, passwordHash, 'admin']
      );
      console.log(`✓ Default admin user created: ${adminUsername}`);
      console.warn('⚠ CHANGE DEFAULT PASSWORD IMMEDIATELY!');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-domain.com',
  credentials: true,
}));
app.use(express.json());

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/auth/', apiLimiter);

// JWT verification middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is in database/Redis
    let tokenValid = false;

    if (redisClient) {
      tokenValid = await redisClient.get(`session:${token}`);
    } else {
      const result = await pool.query(
        'SELECT id FROM sessions WHERE token = $1 AND expires_at > NOW()',
        [token]
      );
      tokenValid = result.rows.length > 0;
    }

    if (!tokenValid) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth' });
});

// Login
app.post('/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    // Get user from database
    const result = await pool.query(
      'SELECT id, username, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store token in Redis or database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (redisClient) {
      await redisClient.setEx(`session:${token}`, 24 * 60 * 60, user.id.toString());
    } else {
      await pool.query(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, token, expiresAt]
      );
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
app.post('/auth/logout', verifyToken, async (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');

  try {
    if (redisClient) {
      await redisClient.del(`session:${token}`);
    } else {
      await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
app.get('/auth/verify', verifyToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// Get current user
app.get('/auth/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, role, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
app.post('/auth/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    await initDatabase();
    await initRedis();

    app.listen(PORT, '127.0.0.1', () => {
      console.log('=========================================');
      console.log('Axis-Guardian Authentication Service');
      console.log('=========================================');
      console.log(`✓ Server running on http://127.0.0.1:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('=========================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');

  if (redisClient) {
    await redisClient.quit();
  }

  await pool.end();
  process.exit(0);
});

startServer();
