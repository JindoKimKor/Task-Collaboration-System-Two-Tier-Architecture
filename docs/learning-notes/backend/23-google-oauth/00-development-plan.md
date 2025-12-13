# Google OAuth Backend Implementation Plan

## Overview

Task #23: Add POST /api/auth/google endpoint to authenticate users with Google OAuth.

**GitHub Issue:** #23

---

## What Was Implemented

| Component | Location | Purpose |
|-----------|----------|---------|
| Google.Apis.Auth | NuGet Package | Google ID Token validation library |
| GoogleAuthRequestDto.cs | Controllers/DTOs/Auth/ | Request DTO for Google ID Token |
| IAuthService.GoogleAuthAsync | Services/Interfaces/ | Service contract method signature |
| AuthService.GoogleAuthAsync | Services/ | Google token validation + user creation |
| AuthController.GoogleAuth | Controllers/ | POST /api/auth/google endpoint |

---

## Implementation Flow

```mermaid
flowchart TB
    subgraph TASK23["Task #23: Google OAuth Backend"]
        direction TB
        Package["Google.Apis.Auth<br/>─────────────<br/>NuGet Package 1.73.0"]
        DTO["GoogleAuthRequestDto.cs<br/>─────────────<br/>IdToken: string"]
        Interface["IAuthService.cs<br/>─────────────<br/>+ GoogleAuthAsync(string idToken)"]
        Service["AuthService.cs<br/>─────────────<br/>GoogleAuthAsync implementation"]
        Controller["AuthController.cs<br/>─────────────<br/>POST /api/auth/google"]
    end

    Package --> Service
    DTO --> Controller --> Service --> Interface
```

---

## GoogleAuthRequestDto

### Responsibility

| Aspect | Description |
|--------|-------------|
| **What it does** | Carries Google ID Token from frontend to backend |
| **Where it's used** | Request body of POST /api/auth/google |
| **What it contains** | Single IdToken property |

### Properties

```mermaid
flowchart TB
    subgraph DTO["GoogleAuthRequestDto Properties"]
        direction TB
        P1["IdToken: string<br/>Google ID Token JWT"]
    end
```

### What is Google ID Token?

| Aspect | Description |
|--------|-------------|
| **Format** | JWT (JSON Web Token) |
| **Issued by** | Google after successful sign-in |
| **Contains** | email, name, picture, etc. |
| **Validity** | Short-lived (~1 hour) |

---

## GoogleAuthAsync (Service Method)

### Responsibility

| Aspect | Description |
|--------|-------------|
| **What it does** | Validates Google token, finds/creates user, returns JWT |
| **Where it's called** | From AuthController.GoogleAuth |
| **Returns** | LoginResponseDto with JWT token and user info |

### Logic

```mermaid
flowchart TB
    subgraph SERVICE["GoogleAuthAsync Flow"]
        direction TB
        S1["1. Validate Google ID Token"]
        S2["2. Extract payload (email, name)"]
        S3["3. Find user by email"]
        S4{"User exists?"}
        S5["4a. Use existing user"]
        S6["4b. Create new user"]
        S7["5. Generate JWT token"]
        S8["6. Return LoginResponseDto"]

        S1 --> S2 --> S3 --> S4
        S4 -->|"Yes"| S5 --> S7
        S4 -->|"No"| S6 --> S7
        S7 --> S8
    end
```

### GoogleJsonWebSignature.ValidateAsync

```mermaid
sequenceDiagram
    participant BE as Backend
    participant Google as Google Servers

    BE->>Google: ValidateAsync(idToken)
    Note over Google: 1. Verify signature
    Note over Google: 2. Check expiration
    Note over Google: 3. Validate issuer
    Google-->>BE: Payload (email, name, etc.)
```

| Validation | Description |
|------------|-------------|
| Signature | Token signed by Google |
| Expiration | Token not expired |
| Issuer | Token from accounts.google.com |

### Runtime Behavior

| Scenario | Result |
|----------|--------|
| Valid token, user exists | Login existing user |
| Valid token, user doesn't exist | Create new user, then login |
| Invalid token | Throws exception |
| Expired token | Throws exception |

---

## OAuth User Creation

### Comparison: Password vs OAuth User

```mermaid
flowchart LR
    subgraph PASSWORD["Password User"]
        direction TB
        P1["Email: user input"]
        P2["Name: user input"]
        P3["Username: user input"]
        P4["PasswordHash: BCrypt hash"]
    end

    subgraph OAUTH["OAuth User"]
        direction TB
        O1["Email: from Google"]
        O2["Name: from Google"]
        O3["Username: email prefix"]
        O4["PasswordHash: empty string"]
    end
```

| Field | Password User | OAuth User |
|-------|---------------|------------|
| Email | User input | From Google payload |
| Name | User input | From Google payload |
| Username | User input | email.Split('@')[0] |
| PasswordHash | BCrypt hash | Empty string "" |
| Role | Based on AdminEmail | Based on AdminEmail |

### Why Empty PasswordHash?

| Aspect | Description |
|--------|-------------|
| **Security** | OAuth users authenticate via Google, not password |
| **Login** | Only /api/auth/google works, /api/auth/login won't work |
| **Future** | Could allow linking password to OAuth account |

---

## GoogleAuth Endpoint

### Responsibility

| Aspect | Description |
|--------|-------------|
| **What it does** | HTTP entry point for Google OAuth |
| **Route** | POST /api/auth/google |
| **Auth Required** | No - this creates authentication |
| **Returns** | 200 OK with token, or 400 Bad Request |

### Logic

```mermaid
flowchart TB
    subgraph ENDPOINT["POST /api/auth/google"]
        direction TB
        E1["1. Receive GoogleAuthRequestDto"]
        E2["2. Call _authService.GoogleAuthAsync(idToken)"]
        E3{"Success?"}
        E4["Return Ok(result)"]
        E5["Return BadRequest(error)"]

        E1 --> E2 --> E3
        E3 -->|"Yes"| E4
        E3 -->|"No"| E5
    end
```

### Runtime Behavior

| HTTP Status | Condition |
|-------------|-----------|
| 200 OK | Valid Google token, user created/found |
| 400 Bad Request | Invalid token, Google validation failed |

---

## Request Flow (End-to-End)

```mermaid
sequenceDiagram
    participant User
    participant FE as Frontend
    participant Google as Google
    participant Controller as AuthController
    participant Service as AuthService
    participant Repo as UserRepository
    participant DB as Database

    User->>FE: Click "Sign in with Google"
    FE->>Google: Open Google Sign-In
    Google->>User: Show login form
    User->>Google: Enter credentials
    Google-->>FE: Return ID Token

    FE->>Controller: POST /api/auth/google<br/>{ idToken: "..." }
    Controller->>Service: GoogleAuthAsync(idToken)

    Service->>Google: ValidateAsync(idToken)
    Google-->>Service: Payload (email, name)

    Service->>Repo: FindByEmailAsync(email)
    Repo->>DB: SELECT * FROM Users WHERE Email = ?

    alt User exists
        DB-->>Repo: User record
        Repo-->>Service: User entity
    else User doesn't exist
        DB-->>Repo: null
        Repo-->>Service: null
        Service->>Repo: AddAsync(newUser)
        Repo->>DB: INSERT INTO Users
        DB-->>Repo: User with ID
        Repo-->>Service: User entity
    end

    Service->>Service: GenerateJwtToken(user)
    Service-->>Controller: LoginResponseDto
    Controller-->>FE: 200 OK + { token, user }
    FE->>FE: Store token, redirect to /board
```

---

## Comparison: Login Endpoints

```mermaid
flowchart TB
    subgraph ENDPOINTS["Authentication Endpoints"]
        direction LR

        subgraph REGISTER["/api/auth/register"]
            R1["Input: name, email, username, password"]
            R2["Creates user with password"]
            R3["Returns: token + user"]
        end

        subgraph LOGIN["/api/auth/login"]
            L1["Input: usernameOrEmail, password"]
            L2["Verifies password with BCrypt"]
            L3["Returns: token + user"]
        end

        subgraph GOOGLE["/api/auth/google"]
            G1["Input: idToken"]
            G2["Validates with Google"]
            G3["Creates user if needed"]
            G4["Returns: token + user"]
        end
    end
```

| Endpoint | Input | Authentication Method |
|----------|-------|----------------------|
| POST /api/auth/register | name, email, username, password | Password (BCrypt) |
| POST /api/auth/login | usernameOrEmail, password | Password (BCrypt) |
| POST /api/auth/google | idToken | Google OAuth |

---

## Error Handling

```mermaid
flowchart TB
    subgraph ERRORS["Possible Errors"]
        direction TB
        E1["Invalid ID Token<br/>Google validation fails"]
        E2["Expired Token<br/>Token too old"]
        E3["Network Error<br/>Can't reach Google"]
    end

    E1 --> R1["400 Bad Request<br/>GOOGLE_AUTH_FAILED"]
    E2 --> R1
    E3 --> R1
```

### Error Response

```json
{
  "error": "GOOGLE_AUTH_FAILED",
  "message": "JWT is not yet valid."
}
```

---

## Checklist

- [x] Install Google.Apis.Auth NuGet package
- [x] Create GoogleAuthRequestDto.cs
- [x] Add GoogleAuthAsync to IAuthService
- [x] Implement GoogleAuthAsync in AuthService
- [x] Add GoogleAuth endpoint to AuthController
- [x] Build successful
- [ ] E2E test (after Frontend Task #24)

---

## Related Documentation

- [Task #6 Auth Service](../06-auth-service/00-development-plan.md)
- [Task #7 Auth Controller](../07-auth-controller/00-development-plan.md)
- [Task #21 Get Current User](../21-get-current-user/00-development-plan.md)
