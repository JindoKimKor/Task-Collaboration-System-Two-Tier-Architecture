# Login Architecture Diagram

## System Overview

```mermaid
flowchart TB
    subgraph CLIENT["Client Layer"]
        direction TB
        UI["Login Form"]
    end

    subgraph API["API Layer"]
        direction TB
        Controller["AuthController<br/>─────────────<br/>POST /api/auth/login"]
    end

    subgraph SERVICE["Service Layer"]
        direction TB
        AuthService["AuthService<br/>─────────────<br/>LoginAsync()"]
        JwtService["JwtService<br/>─────────────<br/>GenerateToken()"]
    end

    subgraph DATA["Data Layer"]
        direction TB
        UoW["UnitOfWork"]
        UserRepo["UserRepository<br/>─────────────<br/>FindByEmailOrUsernameAsync()"]
        DB[(InMemory Database)]
    end

    UI -->|"POST /api/auth/login"| Controller
    Controller -->|"LoginAsync(request)"| AuthService
    AuthService -->|"FindByEmailOrUsernameAsync()"| UoW
    UoW -->|"delegates"| UserRepo
    UserRepo -->|"query"| DB
    AuthService -->|"GenerateToken(user)"| JwtService
    Controller -->|"200 OK + JWT"| UI
```

---

## Login Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller as AuthController
    participant AuthSvc as AuthService
    participant BCrypt as BCrypt.Net
    participant UoW as UnitOfWork
    participant UserRepo as UserRepository
    participant JwtSvc as JwtService

    Note over Client,JwtSvc: Login Request Flow

    Client->>Controller: POST /api/auth/login
    Note right of Client: {usernameOrEmail, password}

    Controller->>AuthSvc: LoginAsync(request)

    AuthSvc->>UoW: Users.FindByEmailOrUsernameAsync()
    UoW->>UserRepo: FindByEmailOrUsernameAsync(input)
    UserRepo-->>UoW: User or null
    UoW-->>AuthSvc: User or null

    alt User is null
        AuthSvc-->>Controller: throw UnauthorizedAccessException
        Controller-->>Client: 401 Unauthorized
    else User found
        AuthSvc->>BCrypt: Verify(password, passwordHash)
        BCrypt-->>AuthSvc: true/false

        alt Password invalid
            AuthSvc-->>Controller: throw UnauthorizedAccessException
            Controller-->>Client: 401 Unauthorized
        else Password valid
            AuthSvc->>JwtSvc: GenerateToken(user)
            JwtSvc-->>AuthSvc: JWT token string
            AuthSvc-->>Controller: LoginResponseDto
            Controller-->>Client: 200 OK + {token, userId, ...}
        end
    end
```

---

## Layer Responsibilities

```mermaid
flowchart TB
    subgraph CONTROLLER["Controller Layer"]
        direction TB
        C1["AuthController.Login()"]
        C2["• HTTP entry point"]
        C3["• Model binding (DTO)"]
        C4["• Exception → HTTP status mapping"]
        C5["• Returns ActionResult"]
    end

    subgraph SERVICE["Service Layer"]
        direction TB
        S1["AuthService.LoginAsync()"]
        S2["• Business logic"]
        S3["• Credential validation"]
        S4["• Coordinates with other services"]
        S5["• Throws business exceptions"]
    end

    subgraph INFRASTRUCTURE["Infrastructure Layer"]
        direction TB
        I1["JwtService / UserRepository"]
        I2["• Token generation"]
        I3["• Database queries"]
        I4["• Implementation details"]
    end

    CONTROLLER --> SERVICE --> INFRASTRUCTURE
```

---

## Dependency Injection Graph

```mermaid
flowchart TB
    subgraph DI["Dependency Injection Container"]
        direction TB

        subgraph INTERFACES["Interfaces"]
            IAuth["IAuthService"]
            IJwt["IJwtService"]
            IUoW["IUnitOfWork"]
            IUserRepo["IUserRepository"]
        end

        subgraph IMPLEMENTATIONS["Implementations"]
            Auth["AuthService"]
            Jwt["JwtService"]
            UoW["UnitOfWork"]
            UserRepo["UserRepository"]
        end

        IAuth -.->|"Scoped"| Auth
        IJwt -.->|"Scoped"| Jwt
        IUoW -.->|"Scoped"| UoW
        IUserRepo -.->|"Scoped"| UserRepo
    end

    subgraph CONTROLLER["Controller"]
        AuthController["AuthController<br/>─────────────<br/>IAuthService"]
    end

    AuthController -->|"injects"| IAuth
    Auth -->|"depends on"| IJwt
    Auth -->|"depends on"| IUoW
    UoW -->|"exposes"| IUserRepo
```

---

## Error Handling Flow

```mermaid
flowchart TB
    subgraph ERRORS["Error Scenarios"]
        direction TB

        subgraph MODEL["Model Binding Errors"]
            M1["Missing fields"]
            M2["Invalid JSON"]
            M3["Wrong content type"]
            M4["Result: 400 Bad Request"]
        end

        subgraph AUTH["Authentication Errors"]
            A1["User not found"]
            A2["Wrong password"]
            A3["Both throw UnauthorizedAccessException"]
            A4["Result: 401 Unauthorized"]
        end

        subgraph INTERNAL["Internal Errors"]
            I1["Database error"]
            I2["Service exception"]
            I3["Result: 500 Internal Server Error"]
        end
    end

    MODEL --> M4
    AUTH --> A4
    INTERNAL --> I3
```

---

## Security Design

```mermaid
flowchart TB
    subgraph SECURITY["Security Measures"]
        direction TB

        subgraph PASSWORD["Password Security"]
            P1["BCrypt hashing (cost factor 12)"]
            P2["Salt automatically generated"]
            P3["Passwords never stored in plain text"]
        end

        subgraph TOKEN["Token Security"]
            T1["JWT signed with HMAC-SHA256"]
            T2["Contains user claims"]
            T3["7-day expiration"]
        end

        subgraph ERROR["Error Security"]
            E1["Generic error message"]
            E2["Same message for user-not-found and wrong-password"]
            E3["Prevents user enumeration attacks"]
        end
    end
```

---

## Data Flow Summary

| Step | Component | Action | Output |
|------|-----------|--------|--------|
| 1 | Client | Send credentials | HTTP POST request |
| 2 | Model Binding | Validate request | LoginRequestDto |
| 3 | AuthController | Route to service | LoginAsync() call |
| 4 | AuthService | Find user | User or null |
| 5 | BCrypt | Verify password | true/false |
| 6 | JwtService | Generate token | JWT string |
| 7 | AuthService | Build response | LoginResponseDto |
| 8 | AuthController | Return result | 200 OK or 401 |
