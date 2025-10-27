# Axis-Guardian Authentication Service

Simple JWT-based authentication service for Axis-Guardian.

## Features

- JWT token-based authentication
- Session storage (Redis or PostgreSQL)
- Password hashing with bcrypt
- Rate limiting (5 login attempts per 15 minutes)
- Helmet security headers
- CORS support

## API Endpoints

### POST /auth/login
Login with username and password.

**Request:**
```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### POST /auth/logout
Logout and invalidate token.

**Headers:**
```
Authorization: Bearer <token>
```

### GET /auth/verify
Verify if token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

### GET /auth/me
Get current user information.

**Headers:**
```
Authorization: Bearer <token>
```

### POST /auth/change-password
Change user password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

## Setup

1. Install dependencies:
   ```bash
   cd backend/auth-service
   npm install
   ```

2. Configure environment variables in `.env.production`

3. Start service:
   ```bash
   npm start
   ```

## Default Credentials

**Username:** admin
**Password:** Set via `ADMIN_PASSWORD` in `.env.production`

**⚠️ IMPORTANT:** Change the default password immediately after first login!

## Security Notes

- Tokens expire after 24 hours
- Rate limiting: 5 login attempts per 15 minutes
- Passwords are hashed with bcrypt (10 rounds)
- Sessions are stored in Redis (or PostgreSQL fallback)
- All endpoints use HTTPS in production
