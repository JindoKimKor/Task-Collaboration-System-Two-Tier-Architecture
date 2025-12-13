# Token Refresh Backend Implementation Plan

## Overview

Task #25: Add POST /api/auth/refresh endpoint to refresh access tokens using refresh tokens.

**GitHub Issue:** #25

---

## What Was Implemented

| Component | Location | Purpose |
|-----------|----------|---------|
| RefreshToken field | LoginResponseDto.cs | Return refresh token in auth responses |
| RefreshTokenRequestDto.cs | Controllers/DTOs/Auth/ | Request DTO for refresh token |
| ConcurrentDictionary | AuthService.cs | In-memory refresh token storage |
| GenerateRefreshToken() | AuthService.cs | Private helper to create/store refresh tokens |
| IAuthService.RefreshTokenAsync | Services/Interfaces/ | Service contract method signature |
| AuthService.RefreshTokenAsync | Services/ | Refresh token validation + new token generation |
| AuthController.RefreshToken | Controllers/ | POST /api/auth/refresh endpoint |

---

## Implementation Flow

```mermaid
flowchart TB
    subgraph TASK25["Task #25: Token Refresh Backend"]
        direction TB
        DTO1["LoginResponseDto.cs<br/>─────────────<br/>+ RefreshToken field"]
        DTO2["RefreshTokenRequestDto.cs<br/>─────────────<br/>RefreshToken: string"]
        Storage["ConcurrentDictionary<br/>─────────────<br/>In-memory storage"]
        Helper["GenerateRefreshToken()<br/>─────────────<br/>Create + store token"]
        Interface["IAuthService.cs<br/>─────────────<br/>+ RefreshTokenAsync()"]
        Service["AuthService.cs<br/>─────────────<br/>RefreshTokenAsync impl"]
        Controller["AuthController.cs<br/>─────────────<br/>POST /api/auth/refresh"]
    end

    DTO1 --> Service
    DTO2 --> Controller
    Storage --> Service
    Helper --> Service
    Interface --> Service
    Controller --> Service
```

---

## Token Lifecycle

### Before (Single Token)

```mermaid
flowchart LR
    Login["Login"] --> Token["Access Token<br/>(15 min)"]
    Token --> Expired["Expired"]
    Expired --> Relogin["Force Re-login"]
```

### After (Dual Token)

```mermaid
flowchart LR
    Login["Login"] --> Tokens["Access Token (15 min)<br/>+ Refresh Token (7 days)"]
    Tokens --> Expired["Access Expired"]
    Expired --> Refresh["POST /auth/refresh"]
    Refresh --> NewTokens["New Access Token<br/>+ New Refresh Token"]
    NewTokens --> Expired
```

---

## RefreshTokenRequestDto

### Responsibility

| Aspect | Description |
|--------|-------------|
| **What it does** | Carries refresh token from frontend to backend |
| **Where it's used** | Request body of POST /api/auth/refresh |
| **What it contains** | Single RefreshToken property |

### Properties

```mermaid
flowchart TB
    subgraph DTO["RefreshTokenRequestDto Properties"]
        direction TB
        P1["RefreshToken: string<br/>64-character hex string"]
    end
```

---

## In-Memory Token Storage

### ConcurrentDictionary

```mermaid
flowchart TB
    subgraph STORAGE["Refresh Token Storage"]
        direction TB

        subgraph DICT["ConcurrentDictionary<string, (int, DateTime)>"]
            K1["Key: 'a1b2c3...'"] --> V1["Value: (UserId: 5, Expiry: 2024-01-20)"]
            K2["Key: 'd4e5f6...'"] --> V2["Value: (UserId: 12, Expiry: 2024-01-21)"]
        end
    end
```

| Aspect | Description |
|--------|-------------|
| **Key** | Refresh token string (64 chars) |
| **Value** | Tuple of (UserId, Expiry DateTime) |
| **Thread-safe** | Yes (ConcurrentDictionary) |
| **Persistence** | None (lost on restart) |

### Why In-Memory?

| Approach | Pros | Cons |
|----------|------|------|
| **In-Memory (current)** | Simple, fast, no DB changes | Lost on restart |
| **Database (production)** | Persistent, revocable | More complex |
| **Redis (enterprise)** | Fast, persistent, distributed | External dependency |

---

## GenerateRefreshToken() Helper

### Responsibility

| Aspect | Description |
|--------|-------------|
| **What it does** | Creates random token string and stores in dictionary |
| **Where it's called** | RegisterAsync, LoginAsync, GoogleAuthAsync, RefreshTokenAsync |
| **Returns** | 64-character hex string |

### Logic

```mermaid
flowchart TB
    subgraph HELPER["GenerateRefreshToken(userId)"]
        direction TB
        H1["1. Generate random token<br/>Guid + Guid = 64 chars"]
        H2["2. Set expiry<br/>DateTime.UtcNow.AddDays(7)"]
        H3["3. Store in dictionary<br/>_refreshTokens[token] = (userId, expiry)"]
        H4["4. Return token string"]

        H1 --> H2 --> H3 --> H4
    end
```

### Token Format

```
Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N")
= 32 chars                  + 32 chars
= 64 character hex string
Example: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678"
```

---

## RefreshTokenAsync (Service Method)

### Responsibility

| Aspect | Description |
|--------|-------------|
| **What it does** | Validates refresh token, issues new tokens |
| **Where it's called** | From AuthController.RefreshToken |
| **Returns** | LoginResponseDto with new tokens |

### Logic

```mermaid
flowchart TB
    subgraph SERVICE["RefreshTokenAsync Flow"]
        direction TB
        S1["1. Lookup token in dictionary"]
        S2{"Token exists?"}
        S3["2. Check expiry"]
        S4{"Not expired?"}
        S5["3. Get user from DB"]
        S6{"User exists?"}
        S7["4. Remove old refresh token<br/>(one-time use)"]
        S8["5. Generate new JWT"]
        S9["6. Generate new refresh token"]
        S10["7. Return LoginResponseDto"]

        ERR1["Throw: Invalid refresh token"]
        ERR2["Throw: Refresh token expired"]
        ERR3["Throw: User not found"]

        S1 --> S2
        S2 -->|"No"| ERR1
        S2 -->|"Yes"| S3 --> S4
        S4 -->|"No"| ERR2
        S4 -->|"Yes"| S5 --> S6
        S6 -->|"No"| ERR3
        S6 -->|"Yes"| S7 --> S8 --> S9 --> S10
    end
```

### Token Rotation

```mermaid
flowchart LR
    subgraph ROTATION["Token Rotation (Security)"]
        direction LR
        Old["Old Refresh Token<br/>─────────────<br/>a1b2c3..."]
        Arrow["→ Used once →"]
        Deleted["DELETED"]
        New["New Refresh Token<br/>─────────────<br/>d4e5f6..."]
    end

    Old --> Arrow --> Deleted
    Arrow --> New
```

| Aspect | Without Rotation | With Rotation |
|--------|------------------|---------------|
| Token reuse | Same token forever | New token each refresh |
| If stolen | Attacker has permanent access | Attacker can use only once |
| Detection | Hard to detect theft | Original user gets error on next refresh |

---

## RefreshToken Endpoint

### Responsibility

| Aspect | Description |
|--------|-------------|
| **What it does** | HTTP entry point for token refresh |
| **Route** | POST /api/auth/refresh |
| **Auth Required** | No - access token is expired |
| **Returns** | 200 OK with new tokens, or 401 Unauthorized |

### Logic

```mermaid
flowchart TB
    subgraph ENDPOINT["POST /api/auth/refresh"]
        direction TB
        E1["1. Receive RefreshTokenRequestDto"]
        E2["2. Call _authService.RefreshTokenAsync(token)"]
        E3{"Success?"}
        E4["Return Ok(result)"]
        E5["Return Unauthorized(error)"]

        E1 --> E2 --> E3
        E3 -->|"Yes"| E4
        E3 -->|"No"| E5
    end
```

### Why No [Authorize]?

```mermaid
flowchart TB
    subgraph WHY["Why No Auth Required?"]
        direction TB

        subgraph SCENARIO["Scenario"]
            S1["Access Token: EXPIRED"]
            S2["Refresh Token: VALID"]
        end

        subgraph PROBLEM["If [Authorize] required"]
            P1["JWT validation fails"]
            P2["401 Unauthorized before reaching endpoint"]
            P3["Cannot refresh!"]
        end

        subgraph SOLUTION["Without [Authorize]"]
            O1["Endpoint receives request"]
            O2["Validates refresh token manually"]
            O3["Issues new tokens"]
        end
    end
```

---

## Request Flow (End-to-End)

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant Controller as AuthController
    participant Service as AuthService
    participant Dict as ConcurrentDictionary
    participant Repo as UserRepository
    participant JWT as JwtService

    Note over FE: Access token expired

    FE->>Controller: POST /api/auth/refresh<br/>{ refreshToken: "a1b2c3..." }

    Controller->>Service: RefreshTokenAsync("a1b2c3...")

    Service->>Dict: TryGetValue("a1b2c3...")
    Dict-->>Service: (UserId: 5, Expiry: future)

    Service->>Service: Check expiry < now? No

    Service->>Repo: GetByIdAsync(5)
    Repo-->>Service: User entity

    Service->>Dict: TryRemove("a1b2c3...")
    Note over Dict: Old token deleted

    Service->>JWT: GenerateToken(user)
    JWT-->>Service: New access token

    Service->>Service: GenerateRefreshToken(5)
    Service->>Dict: Store new token

    Service-->>Controller: LoginResponseDto
    Controller-->>FE: 200 OK + new tokens

    Note over FE: Store new tokens, continue
```

---

## All Auth Endpoints Now Return RefreshToken

```mermaid
flowchart TB
    subgraph ENDPOINTS["Updated Endpoints"]
        direction LR

        subgraph REGISTER["/api/auth/register"]
            R1["Returns:"]
            R2["token ✅"]
            R3["refreshToken ✅ NEW"]
        end

        subgraph LOGIN["/api/auth/login"]
            L1["Returns:"]
            L2["token ✅"]
            L3["refreshToken ✅ NEW"]
        end

        subgraph GOOGLE["/api/auth/google"]
            G1["Returns:"]
            G2["token ✅"]
            G3["refreshToken ✅ NEW"]
        end

        subgraph REFRESH["/api/auth/refresh"]
            F1["Returns:"]
            F2["token ✅ NEW"]
            F3["refreshToken ✅ NEW"]
        end
    end
```

| Endpoint | Input | Output |
|----------|-------|--------|
| POST /api/auth/register | name, email, username, password | token + refreshToken |
| POST /api/auth/login | usernameOrEmail, password | token + refreshToken |
| POST /api/auth/google | idToken | token + refreshToken |
| POST /api/auth/refresh | refreshToken | token + refreshToken |

---

## Error Handling

```mermaid
flowchart TB
    subgraph ERRORS["Possible Errors"]
        direction TB
        E1["Invalid token<br/>Not in dictionary"]
        E2["Expired token<br/>Past expiry date"]
        E3["User not found<br/>Deleted from DB"]
    end

    E1 --> R1["401 Unauthorized<br/>INVALID_REFRESH_TOKEN"]
    E2 --> R1
    E3 --> R1
```

### Error Response

```json
{
  "error": "INVALID_REFRESH_TOKEN",
  "message": "Refresh token expired."
}
```

---

## Checklist

- [x] Add RefreshToken field to LoginResponseDto
- [x] Create RefreshTokenRequestDto
- [x] Add ConcurrentDictionary for token storage
- [x] Create GenerateRefreshToken helper method
- [x] Update RegisterAsync to include refresh token
- [x] Update LoginAsync to include refresh token
- [x] Update GoogleAuthAsync to include refresh token
- [x] Add RefreshTokenAsync to IAuthService
- [x] Implement RefreshTokenAsync in AuthService
- [x] Add RefreshToken endpoint to AuthController
- [x] Build successful

---

## Related Documentation

- [01-architecture-diagram.md](./01-architecture-diagram.md) - System architecture
- [02-design-patterns-and-solid.md](./02-design-patterns-and-solid.md) - Design patterns
- [03-programming-concepts.md](./03-programming-concepts.md) - Programming concepts
- [Task #6 Auth Service](../06-auth-service/00-development-plan.md)
- [Task #23 Google OAuth](../23-google-oauth/00-development-plan.md)
