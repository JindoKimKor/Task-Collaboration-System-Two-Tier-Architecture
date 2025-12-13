# Token Refresh Architecture Diagram

## System Architecture

```mermaid
flowchart TB
    subgraph CLIENT["Client (Browser)"]
        direction TB
        FE["Frontend<br/>React App"]
        LS["localStorage<br/>─────────────<br/>token<br/>refreshToken"]
    end

    subgraph BACKEND["Backend (.NET 8)"]
        direction TB

        subgraph CONTROLLER["Controller Layer"]
            AC["AuthController<br/>─────────────<br/>POST /api/auth/refresh"]
        end

        subgraph SERVICE["Service Layer"]
            AS["AuthService<br/>─────────────<br/>RefreshTokenAsync()"]
            JWT["JwtService<br/>─────────────<br/>GenerateToken()"]
        end

        subgraph STORAGE["Token Storage"]
            DICT["ConcurrentDictionary<br/>─────────────<br/>In-Memory Storage"]
        end

        subgraph DATA["Data Layer"]
            UOW["UnitOfWork"]
            REPO["UserRepository"]
        end
    end

    subgraph DATABASE["Database"]
        DB[(SQL Server)]
    end

    FE -->|"1. Access token expired"| LS
    LS -->|"2. Get refresh token"| FE
    FE -->|"3. POST /api/auth/refresh"| AC
    AC -->|"4. RefreshTokenAsync()"| AS
    AS -->|"5. Validate token"| DICT
    DICT -->|"6. Return (userId, expiry)"| AS
    AS -->|"7. GetByIdAsync(userId)"| UOW
    UOW --> REPO
    REPO -->|"8. Query"| DB
    DB -->|"9. User"| REPO
    AS -->|"10. GenerateToken(user)"| JWT
    JWT -->|"11. New JWT"| AS
    AS -->|"12. Store new refresh token"| DICT
    AS -->|"13. LoginResponseDto"| AC
    AC -->|"14. 200 OK + new tokens"| FE
    FE -->|"15. Store new tokens"| LS
```

---

## Component Responsibilities

```mermaid
flowchart TB
    subgraph COMPONENTS["Component Responsibilities"]
        direction TB

        subgraph C1["RefreshTokenRequestDto"]
            C1a["Carry refresh token from frontend"]
        end

        subgraph C2["AuthController.RefreshToken"]
            C2a["HTTP endpoint"]
            C2b["Error handling"]
            C2c["Response formatting"]
        end

        subgraph C3["AuthService.RefreshTokenAsync"]
            C3a["Validate refresh token"]
            C3b["Generate new tokens"]
            C3c["Token rotation"]
        end

        subgraph C4["ConcurrentDictionary"]
            C4a["Store refresh tokens"]
            C4b["Thread-safe operations"]
        end

        subgraph C5["JwtService"]
            C5a["Generate new access token"]
        end

        subgraph C6["UserRepository"]
            C6a["GetByIdAsync"]
        end
    end
```

| Component | Responsibility |
|-----------|----------------|
| RefreshTokenRequestDto | Carry refresh token |
| AuthController | HTTP endpoint, error handling |
| AuthService | Token validation, rotation, generation |
| ConcurrentDictionary | Thread-safe token storage |
| JwtService | Generate new access tokens |
| UserRepository | Fetch user data |

---

## Token Refresh Flow Sequence

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as API Endpoint
    participant LS as localStorage
    participant Controller as AuthController
    participant Service as AuthService
    participant Dict as Token Storage
    participant DB as Database
    participant JWT as JwtService

    Note over FE,JWT: Access Token Expired Scenario

    FE->>API: GET /api/tasks (with expired token)
    API-->>FE: 401 Unauthorized

    Note over FE: Detect 401, attempt refresh

    FE->>LS: Get refresh token
    LS-->>FE: "a1b2c3d4..."

    FE->>Controller: POST /api/auth/refresh<br/>{ refreshToken: "a1b2c3d4..." }

    Controller->>Service: RefreshTokenAsync("a1b2c3d4...")

    Service->>Dict: TryGetValue("a1b2c3d4...")

    alt Token not found
        Dict-->>Service: false
        Service-->>Controller: throw UnauthorizedAccessException
        Controller-->>FE: 401 Unauthorized
    else Token found
        Dict-->>Service: (UserId: 5, Expiry: future)

        alt Token expired
            Service-->>Controller: throw UnauthorizedAccessException
            Controller-->>FE: 401 Unauthorized
        else Token valid
            Service->>DB: GetByIdAsync(5)
            DB-->>Service: User

            Service->>Dict: TryRemove("a1b2c3d4...")
            Note over Dict: Old token invalidated

            Service->>JWT: GenerateToken(user)
            JWT-->>Service: New access token

            Service->>Dict: Store new refresh token

            Service-->>Controller: LoginResponseDto

            Controller-->>FE: 200 OK + new tokens

            FE->>LS: Store new tokens

            FE->>API: Retry original request
            API-->>FE: 200 OK + data
        end
    end
```

---

## Token Storage Architecture

```mermaid
flowchart TB
    subgraph STORAGE["In-Memory Token Storage"]
        direction TB

        subgraph STRUCTURE["ConcurrentDictionary Structure"]
            direction LR

            subgraph KEYS["Keys (Refresh Tokens)"]
                K1["a1b2c3d4..."]
                K2["e5f6g7h8..."]
                K3["i9j0k1l2..."]
            end

            subgraph VALUES["Values (Token Data)"]
                V1["(UserId: 5, Expiry: 2024-01-27)"]
                V2["(UserId: 12, Expiry: 2024-01-28)"]
                V3["(UserId: 3, Expiry: 2024-01-25)"]
            end

            K1 --> V1
            K2 --> V2
            K3 --> V3
        end

        subgraph OPERATIONS["Operations"]
            OP1["TryGetValue - Lookup token"]
            OP2["TryRemove - Delete used token"]
            OP3["Add/Update - Store new token"]
        end
    end
```

| Operation | Method | Thread-Safe |
|-----------|--------|-------------|
| Lookup | TryGetValue | Yes |
| Delete | TryRemove | Yes |
| Add | indexer assignment | Yes |

---

## Dual Token Architecture

```mermaid
flowchart TB
    subgraph TOKENS["Dual Token System"]
        direction LR

        subgraph ACCESS["Access Token (JWT)"]
            A1["Short-lived: 15 min"]
            A2["Contains: userId, role, claims"]
            A3["Used: Every API request"]
            A4["Stored: localStorage"]
            A5["Validated: JWT middleware"]
        end

        subgraph REFRESH["Refresh Token"]
            R1["Long-lived: 7 days"]
            R2["Contains: random string"]
            R3["Used: When access expires"]
            R4["Stored: localStorage"]
            R5["Validated: AuthService"]
        end
    end

    ACCESS -->|"Expires"| REFRESH
    REFRESH -->|"Exchanges for"| ACCESS
```

| Aspect | Access Token | Refresh Token |
|--------|--------------|---------------|
| Format | JWT (encoded) | Random hex string |
| Lifetime | 15 minutes | 7 days |
| Contains | User claims | Just token string |
| Validated by | JWT middleware | AuthService |
| Storage (backend) | Not stored | ConcurrentDictionary |
| Usage | Every request | Only for refresh |

---

## Token Generation Flow

```mermaid
flowchart TB
    subgraph GENERATION["Token Generation"]
        direction TB

        subgraph REFRESH_GEN["GenerateRefreshToken(userId)"]
            RG1["1. Guid.NewGuid().ToString('N')"]
            RG2["+ Guid.NewGuid().ToString('N')"]
            RG3["= 64 character hex string"]
            RG4["2. Expiry = Now + 7 days"]
            RG5["3. Store in dictionary"]

            RG1 --> RG2 --> RG3 --> RG4 --> RG5
        end

        subgraph ACCESS_GEN["JwtService.GenerateToken(user)"]
            AG1["1. Create claims (userId, email, role)"]
            AG2["2. Sign with secret key"]
            AG3["3. Set expiry (from config)"]
            AG4["= JWT string"]

            AG1 --> AG2 --> AG3 --> AG4
        end
    end
```

---

## Token Rotation Diagram

```mermaid
flowchart LR
    subgraph BEFORE["Before Refresh"]
        B1["Access Token A"]
        B2["Refresh Token R1"]
    end

    subgraph REFRESH["POST /auth/refresh"]
        R1["Validate R1"]
        R2["Delete R1"]
        R3["Generate new tokens"]
    end

    subgraph AFTER["After Refresh"]
        A1["Access Token B (new)"]
        A2["Refresh Token R2 (new)"]
    end

    BEFORE --> REFRESH --> AFTER

    B2 -.->|"Invalidated"| X["❌"]
```

| Step | Token R1 Status | Token R2 Status |
|------|-----------------|-----------------|
| Before refresh | Valid, stored | Does not exist |
| During refresh | Removed from storage | Being created |
| After refresh | Invalid (not in storage) | Valid, stored |

---

## Error Handling Flow

```mermaid
flowchart TB
    subgraph REQUEST["POST /api/auth/refresh"]
        R1["{ refreshToken: '...' }"]
    end

    subgraph VALIDATION["Validation Steps"]
        V1{"Token in storage?"}
        V2{"Token not expired?"}
        V3{"User exists?"}
    end

    subgraph ERRORS["Error Cases"]
        E1["Token not found"]
        E2["Token expired"]
        E3["User deleted"]
    end

    subgraph RESPONSES["HTTP Responses"]
        S1["200 OK<br/>New tokens"]
        S2["401 Unauthorized<br/>INVALID_REFRESH_TOKEN"]
    end

    REQUEST --> V1
    V1 -->|"No"| E1 --> S2
    V1 -->|"Yes"| V2
    V2 -->|"No"| E2 --> S2
    V2 -->|"Yes"| V3
    V3 -->|"No"| E3 --> S2
    V3 -->|"Yes"| S1
```

---

## File Structure

```
Backend/TaskCollaborationApp.API/
├── Controllers/
│   ├── AuthController.cs              ← POST /api/auth/refresh
│   └── DTOs/
│       └── Auth/
│           ├── LoginResponseDto.cs    ← + RefreshToken field
│           └── RefreshTokenRequestDto.cs ← NEW
├── Services/
│   ├── Interfaces/
│   │   └── IAuthService.cs            ← + RefreshTokenAsync
│   ├── AuthService.cs                 ← ConcurrentDictionary
│   │                                    + GenerateRefreshToken
│   │                                    + RefreshTokenAsync
│   └── JwtService.cs                  ← Reused
└── Repositories/
    └── UserRepository.cs              ← GetByIdAsync
```

---

## Security Considerations

```mermaid
flowchart TB
    subgraph SECURITY["Security Features"]
        direction TB

        subgraph ROTATION["Token Rotation"]
            S1["Each refresh invalidates old token"]
            S2["Limits damage from stolen token"]
        end

        subgraph EXPIRY["Token Expiry"]
            S3["Access: 15 min (short)"]
            S4["Refresh: 7 days (longer but finite)"]
        end

        subgraph STORAGE["Server-Side Storage"]
            S5["Refresh tokens tracked on server"]
            S6["Can invalidate on logout"]
        end
    end
```

| Threat | Mitigation |
|--------|------------|
| Stolen access token | Short expiry (15 min) |
| Stolen refresh token | Token rotation, one-time use |
| Token replay | Old tokens removed from storage |
| Session hijacking | User ID validated on each refresh |

---

## Related Documentation

- [00-development-plan.md](./00-development-plan.md) - Implementation details
- [02-design-patterns-and-solid.md](./02-design-patterns-and-solid.md) - Design patterns
- [03-programming-concepts.md](./03-programming-concepts.md) - Programming concepts
