# Registration Page - API Contract

[Back to API Documentation](../API-Contract-Documentation.md)

---

## Wireframe

![Registration Page](../../wireframes/Registration-page.png)

---

## User Actions

- Enter Full Name, Email, Username, Password, Confirm Password
- Click "Sign up with Google" for OAuth registration
- Click "Login" link to navigate to login page
- View inline validation errors

---

## Frontend Needs

| Component | Description |
|-----------|-------------|
| Full Name input | Required text field |
| Email input | Required, email format validation |
| Username input | Required, alphanumeric validation |
| Password input | Required, with strength indicator |
| Confirm Password input | Must match password |
| Create Account button | Primary action button |
| Google OAuth button | "Sign up with Google" |
| Login link | Navigation to login page |
| Validation errors | Inline error messages per field |

---

## Backend Processing

| Validation | Description |
|------------|-------------|
| Full Name | Required, 2-100 characters |
| Email | Required, valid format, unique in database |
| Username | Required, 3-50 chars, alphanumeric, unique |
| Password | Min 8 chars, uppercase, lowercase, number, special char |
| Confirm Password | Must match password (frontend only) |
| Password Hashing | Use BCrypt or similar secure hashing |

---

## Project Requirements

> **From Final Project PDF - Section 1: Authentication & Security (4 marks)**
>
> - Create secure user **registration** and login endpoints
> - **Password hashing and security** (0.5 marks)
>
> **API Endpoints Required:**
> | Method | Endpoint | Description |
> |--------|----------|-------------|
> | POST | /api/auth/register | User registration |
>
> **From Section 2: Data Layer - Database Schema**
>
> **Users Table:**
> | Column | Type | Constraints |
> |--------|------|-------------|
> | Id | int | Primary Key |
> | Name | string | Required |
> | Email | string | Unique, Required |
> | Username | string | Unique, Required |
> | PasswordHash | string | Required |
> | Role | string | Required |
> | CreatedAt | DateTime | Required |
>
> **Sample Users to Seed:**
> - 1 Admin user (configurable email)
> - 4 Regular users

---

## API Contracts

### API 2.1: User Registration

```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response - Success (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "expiresIn": 604800,
  "user": {
    "id": 6,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "role": "User"
  }
}
```

> **Note:** Registration returns the same response format as login (`LoginResponseDto`), enabling automatic login after successful registration.

**Response - Error (400) - Validation:**
```json
{
  "error": "Validation failed",
  "errors": {
    "email": "Email is already registered",
    "username": "Username is already taken",
    "password": "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
  }
}
```
