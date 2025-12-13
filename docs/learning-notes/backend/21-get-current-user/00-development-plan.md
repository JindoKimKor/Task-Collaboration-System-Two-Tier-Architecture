# Get Current User Implementation Plan

## Overview

Task #21: Add GET /api/auth/me endpoint to retrieve current authenticated user's information.

**GitHub Issue:** #21

---

## What Was Implemented

| Component | Location | Purpose |
|-----------|----------|---------|
| UserDto.cs | Controllers/DTOs/Auth/ | Response DTO for /me endpoint |
| IAuthService.GetCurrentUserAsync | Services/Interfaces/ | Service contract method signature |
| AuthService.GetCurrentUserAsync | Services/ | Implementation to fetch user by ID |
| AuthController.GetCurrentUser | Controllers/ | GET /api/auth/me endpoint |
| Swagger JWT Config | Program.cs | Enable JWT authentication in Swagger UI |

---

## Implementation Flow

```mermaid
flowchart TB
    subgraph TASK21["Task #21: Get Current User"]
        direction TB
        DTO["UserDto.cs<br/>─────────────<br/>Id, Name, Username,<br/>Email, Role, CreatedAt"]
        Interface["IAuthService.cs<br/>─────────────<br/>+ GetCurrentUserAsync(int userId)"]
        Service["AuthService.cs<br/>─────────────<br/>GetCurrentUserAsync implementation"]
        Controller["AuthController.cs<br/>─────────────<br/>GET /api/auth/me"]
        Swagger["Program.cs<br/>─────────────<br/>Swagger JWT Config"]
    end

    DTO --> Interface --> Service --> Controller
    Swagger -.->|"enables testing"| Controller
```

---

## UserDto

### Responsibility

| Aspect | Description |
|--------|-------------|
| **What it does** | Carries user information from server to client |
| **Where it's used** | Returned by GET /api/auth/me endpoint |
| **Difference from LoginResponseDto** | No token field - user already authenticated |

### Properties

```mermaid
flowchart TB
    subgraph DTO["UserDto Properties"]
        direction TB
        P1["Id: int"]
        P2["Name: string"]
        P3["Username: string"]
        P4["Email: string"]
        P5["Role: string"]
        P6["CreatedAt: DateTime"]
    end
```

### Why Separate DTO?

| DTO | Contains Token? | Use Case |
|-----|-----------------|----------|
| LoginResponseDto | Yes | Login/Register - client needs token |
| UserDto | No | /me endpoint - client already has token |

---

## GetCurrentUserAsync (Service Method)

### Responsibility

| Aspect | Description |
|--------|-------------|
| **What it does** | Fetches user from database by ID |
| **Where it's called** | From AuthController.GetCurrentUser |
| **Returns** | UserDto or null if user doesn't exist |

### Logic

```mermaid
flowchart TB
    subgraph SERVICE["GetCurrentUserAsync Flow"]
        direction TB
        S1["1. Get user from repository by ID"]
        S2{"User found?"}
        S3["2. Map User entity to UserDto"]
        S4["Return UserDto"]
        S5["Return null"]

        S1 --> S2
        S2 -->|"Yes"| S3
        S3 --> S4
        S2 -->|"No"| S5
    end
```

### Runtime Behavior

| Scenario | Result |
|----------|--------|
| User exists in database | Returns UserDto with user info |
| User doesn't exist (deleted) | Returns null |

---

## GetCurrentUser Endpoint

### Responsibility

| Aspect | Description |
|--------|-------------|
| **What it does** | HTTP entry point for current user info |
| **Route** | GET /api/auth/me |
| **Auth Required** | Yes - [Authorize] attribute |
| **Returns** | 200 OK with UserDto, 401, or 404 |

### Logic

```mermaid
flowchart TB
    subgraph ENDPOINT["GET /api/auth/me"]
        direction TB
        E1["1. Extract userId from JWT claims"]
        E2{"Valid userId?"}
        E3["2. Call _authService.GetCurrentUserAsync(userId)"]
        E4{"User found?"}
        E5["Return Ok(user)"]
        E6["Return Unauthorized()"]
        E7["Return NotFound()"]

        E1 --> E2
        E2 -->|"Yes"| E3
        E2 -->|"No"| E6
        E3 --> E4
        E4 -->|"Yes"| E5
        E4 -->|"No"| E7
    end
```

### JWT Claims Extraction

```csharp
var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
int.TryParse(userIdClaim.Value, out var userId);
```

| Claim Type | Value | Source |
|------------|-------|--------|
| ClaimTypes.NameIdentifier | User ID | JwtService.GenerateToken() |
| ClaimTypes.Email | Email | JwtService.GenerateToken() |
| ClaimTypes.Name | Username | JwtService.GenerateToken() |
| ClaimTypes.Role | Role | JwtService.GenerateToken() |

### Runtime Behavior

| HTTP Status | Condition |
|-------------|-----------|
| 200 OK | Valid token + user exists |
| 401 Unauthorized | No token / Invalid token / Expired token |
| 404 Not Found | Valid token but user deleted from DB |

---

## Swagger JWT Configuration

### Why Needed

| Before | After |
|--------|-------|
| No way to input JWT token in Swagger UI | "Authorize" button appears |
| Cannot test [Authorize] endpoints | Can test all endpoints with JWT |

### Configuration Added

```mermaid
flowchart TB
    subgraph SWAGGER["Swagger JWT Setup"]
        direction TB
        S1["AddSecurityDefinition('Bearer', ...)"]
        S2["• Type: HTTP"]
        S3["• Scheme: Bearer"]
        S4["• BearerFormat: JWT"]
        S5["• Location: Header"]
        S6["AddSecurityRequirement(...)"]
        S7["• Reference: Bearer"]
        S8["• Apply to all endpoints"]
    end
```

### How It Works

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Swagger as Swagger UI
    participant API as API

    Dev->>Swagger: Click "Authorize" button
    Dev->>Swagger: Paste JWT token
    Swagger->>Swagger: Store token in memory

    Dev->>Swagger: Click "Try it out" on /me endpoint
    Swagger->>API: GET /api/auth/me<br/>Authorization: Bearer {token}
    API-->>Swagger: 200 OK + UserDto
    Swagger-->>Dev: Display response
```

---

## Request Flow (End-to-End)

```mermaid
sequenceDiagram
    participant Client
    participant JWTMiddleware as JWT Middleware
    participant Controller as AuthController
    participant Service as AuthService
    participant Repo as UserRepository

    Client->>JWTMiddleware: GET /api/auth/me<br/>Authorization: Bearer {token}

    Note over JWTMiddleware: Validate JWT signature & expiration

    alt Token invalid
        JWTMiddleware-->>Client: 401 Unauthorized
    else Token valid
        JWTMiddleware->>JWTMiddleware: Populate User.Claims
        JWTMiddleware->>Controller: Request continues

        Controller->>Controller: Extract userId from Claims
        Controller->>Service: GetCurrentUserAsync(userId)
        Service->>Repo: GetByIdAsync(userId)
        Repo-->>Service: User or null

        alt User found
            Service-->>Controller: UserDto
            Controller-->>Client: 200 OK + UserDto
        else User not found
            Service-->>Controller: null
            Controller-->>Client: 404 Not Found
        end
    end
```

---

## Testing Results

### Test Cases

| # | Test Case | Input | Expected | Result |
|---|-----------|-------|----------|--------|
| 1 | Valid token (Admin) | Bearer {admin_token} | 200 OK + Admin UserDto | ✅ |
| 2 | Valid token (User) | Bearer {user_token} | 200 OK + User UserDto | ✅ |
| 3 | No token | (no Authorization header) | 401 Unauthorized | ✅ |
| 4 | Invalid token | Bearer invalid123 | 401 Unauthorized | ✅ |
| 5 | Expired token | Bearer {expired_token} | 401 Unauthorized | ✅ |

### Response Example

```json
{
  "id": 1,
  "name": "Admin User",
  "username": "admin",
  "email": "admin@taskcollab.com",
  "role": "Admin",
  "createdAt": "2025-12-13T07:19:13.0707375Z"
}
```

---

## Use Case: App Refresh

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Redux as Redux Store
    participant API

    Note over User,API: User refreshes page (F5)

    User->>Browser: Refresh page
    Browser->>Browser: React app reloads
    Note over Redux: Store is empty (memory cleared)

    Browser->>Browser: Check localStorage for token
    alt Token exists
        Browser->>API: GET /api/auth/me<br/>Authorization: Bearer {token}
        alt Token still valid
            API-->>Browser: 200 OK + UserDto
            Browser->>Redux: dispatch(setUser(userData))
            Note over Redux: User state restored
        else Token expired/invalid
            API-->>Browser: 401 Unauthorized
            Browser->>Browser: Clear localStorage
            Browser->>Browser: Redirect to /login
        end
    else No token
        Browser->>Browser: Redirect to /login
    end
```

---

## Checklist

- [x] Create UserDto.cs
- [x] Add GetCurrentUserAsync to IAuthService
- [x] Implement GetCurrentUserAsync in AuthService
- [x] Add GetCurrentUser endpoint to AuthController
- [x] Add Swagger JWT configuration
- [x] Test with valid token (200 OK)
- [x] Test without token (401 Unauthorized)

---

## Related Documentation

- [Task #12 JWT Middleware](../12-jwt-middleware/00-development-plan.md)
- [Task #13-14 Login](../13-14-login/00-development-plan.md)
- [Task #6 Auth Service](../06-auth-service/00-development-plan.md)
