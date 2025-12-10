# Login Page - API Contract

[Back to API Documentation](../API-Contract-Documentation.md)

---

## Wireframe

![Login Page](../../wireframes/Login-page.png)

---

## User Actions

- Enter Username/Email and Password to login
- Click "Sign in with Google" for OAuth login
- Click "Register" link to navigate to registration page
- Toggle password visibility
- Check "Remember me" for persistent session

---

## Frontend Needs

| Component | Description |
|-----------|-------------|
| Username/Email input | Text field with email icon |
| Password input | Password field with show/hide toggle |
| Remember me | Checkbox for session persistence |
| Login button | Primary action button (JIRA blue) |
| Google OAuth button | "Sign in with Google" with Google logo |
| Register link | Navigation to registration page |
| Error message area | Display validation/authentication errors |

---

## Backend Processing

| Validation | Description |
|------------|-------------|
| Username/Email | Required, must exist in database |
| Password | Required, must match hashed password |
| Account status | Check if account is active/not locked |
| JWT Generation | Generate token with user claims and role |
| Token expiry | Set to 7 days as per requirements |

---

## Project Requirements

> **From Final Project PDF - Section 1: Authentication & Security (4 marks)**
>
> - Implement **JWT-based authentication** for API endpoints
> - Support **dual authentication**: OAuth (Google) + Username/Password
> - Create secure user registration and login endpoints
> - Configure **CORS policies** for frontend consumption
> - Add **role-based claims** to JWT tokens (Admin, User)
>
> **API Endpoints Required:**
> | Method | Endpoint | Description |
> |--------|----------|-------------|
> | POST | /api/auth/login | Login with username/password |
> | POST | /api/auth/google | Google OAuth callback |
>
> **Configuration Requirements:**
> - JWT secret key in appsettings.json
> - Token expiry: 7 days
> - Admin user email configurable

---

## API Contracts

### API 1.1: Username/Password Login

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "usernameOrEmail": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response - Success (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "expiresIn": 604800,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "role": "User"
  }
}
```

**Response - Error (400):**
```json
{
  "error": "Invalid credentials",
  "message": "Username or password is incorrect"
}
```

**Response - Error (401):**
```json
{
  "error": "Unauthorized",
  "message": "Account is locked or disabled"
}
```

---

### API 1.2: Google OAuth Login

```http
POST /api/auth/google
Content-Type: application/json
```

**Request Body:**
```json
{
  "idToken": "google-oauth-id-token-from-frontend"
}
```

**Response - Success (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "expiresIn": 604800,
  "user": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane.smith@gmail.com",
    "username": "janesmith",
    "role": "User"
  },
  "isNewUser": false
}
```

**Response - Error (400):**
```json
{
  "error": "Invalid token",
  "message": "Google authentication failed"
}
```

---

### API 1.3: Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**Response - Success (200):**
```json
{
  "token": "new-jwt-token...",
  "refreshToken": "new-refresh-token...",
  "expiresIn": 604800
}
```

**Response - Error (401):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired refresh token"
}
```
