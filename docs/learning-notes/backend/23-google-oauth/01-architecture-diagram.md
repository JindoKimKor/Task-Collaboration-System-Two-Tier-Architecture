# Google OAuth Architecture Diagram

## System Architecture

```mermaid
flowchart TB
    subgraph CLIENT["Client (Browser)"]
        direction TB
        FE["Frontend<br/>React App"]
        GSI["Google Sign-In<br/>Popup"]
    end

    subgraph GOOGLE["Google Cloud"]
        direction TB
        GAuth["Google OAuth<br/>Server"]
        GValidate["Token Validation<br/>Service"]
    end

    subgraph BACKEND["Backend (.NET 8)"]
        direction TB

        subgraph CONTROLLER["Controller Layer"]
            AC["AuthController<br/>─────────────<br/>POST /api/auth/google"]
        end

        subgraph SERVICE["Service Layer"]
            AS["AuthService<br/>─────────────<br/>GoogleAuthAsync()"]
            JWT["JwtService<br/>─────────────<br/>GenerateToken()"]
        end

        subgraph DATA["Data Layer"]
            UOW["UnitOfWork"]
            REPO["UserRepository"]
        end
    end

    subgraph DATABASE["Database"]
        DB[(SQL Server)]
    end

    FE -->|"1. Click Google Sign-In"| GSI
    GSI -->|"2. User authenticates"| GAuth
    GAuth -->|"3. Return ID Token"| GSI
    GSI -->|"4. ID Token"| FE
    FE -->|"5. POST /api/auth/google"| AC
    AC -->|"6. GoogleAuthAsync(idToken)"| AS
    AS -->|"7. ValidateAsync(idToken)"| GValidate
    GValidate -->|"8. Return Payload"| AS
    AS -->|"9. FindByEmailAsync"| UOW
    UOW --> REPO
    REPO -->|"10. Query"| DB
    DB -->|"11. User or null"| REPO
    AS -->|"12. GenerateToken(user)"| JWT
    JWT -->|"13. JWT Token"| AS
    AS -->|"14. LoginResponseDto"| AC
    AC -->|"15. 200 OK + JWT"| FE
```

---

## Component Responsibilities

```mermaid
flowchart TB
    subgraph COMPONENTS["Component Responsibilities"]
        direction TB

        subgraph C1["GoogleAuthRequestDto"]
            C1a["Carry ID Token from frontend"]
        end

        subgraph C2["AuthController.GoogleAuth"]
            C2a["HTTP endpoint"]
            C2b["Error handling"]
            C2c["Response formatting"]
        end

        subgraph C3["AuthService.GoogleAuthAsync"]
            C3a["Validate token with Google"]
            C3b["Find or create user"]
            C3c["Generate JWT"]
        end

        subgraph C4["GoogleJsonWebSignature"]
            C4a["Verify Google token"]
            C4b["Extract user info"]
        end

        subgraph C5["UserRepository"]
            C5a["FindByEmailAsync"]
            C5b["AddAsync"]
        end

        subgraph C6["JwtService"]
            C6a["Generate our JWT"]
        end
    end
```

| Component              | Responsibility                |
| ---------------------- | ----------------------------- |
| GoogleAuthRequestDto   | Carry Google ID Token         |
| AuthController         | HTTP endpoint, error handling |
| AuthService            | Orchestrate OAuth flow        |
| GoogleJsonWebSignature | Validate Google token         |
| UserRepository         | User data access              |
| JwtService             | Generate our JWT token        |

---

## Authentication Flow Sequence

```mermaid
sequenceDiagram
    participant User
    participant FE as Frontend
    participant Google as Google
    participant BE as Backend
    participant DB as Database

    Note over User,DB: Step 1: User initiates Google Sign-In

    User->>FE: Click "Sign in with Google"
    FE->>Google: Open OAuth popup

    Note over User,DB: Step 2: User authenticates with Google

    Google->>User: Show login form
    User->>Google: Enter credentials
    Google->>Google: Verify credentials

    Note over User,DB: Step 3: Google returns ID Token

    Google-->>FE: ID Token (JWT)

    Note over User,DB: Step 4: Frontend sends token to Backend

    FE->>BE: POST /api/auth/google<br/>{ idToken: "eyJhbG..." }

    Note over User,DB: Step 5: Backend validates with Google

    BE->>Google: ValidateAsync(idToken)
    Google-->>BE: Payload { email, name }

    Note over User,DB: Step 6: Find or create user

    BE->>DB: FindByEmailAsync(email)

    alt User exists
        DB-->>BE: User record
    else User doesn't exist
        BE->>DB: Create new user
        DB-->>BE: New user with ID
    end

    Note over User,DB: Step 7: Generate our JWT

    BE->>BE: JwtService.GenerateToken(user)

    Note over User,DB: Step 8: Return response

    BE-->>FE: { token, userId, email, ... }
    FE->>FE: Store token in localStorage
    FE->>FE: Redirect to /board
```

---

## Token Flow

```mermaid
flowchart LR
    subgraph GOOGLE_TOKEN["Google ID Token"]
        direction TB
        GT1["Issued by: Google"]
        GT2["Contains: email, name, picture"]
        GT3["Validity: ~1 hour"]
        GT4["Purpose: Prove Google auth"]
    end

    subgraph OUR_TOKEN["Our JWT Token"]
        direction TB
        OT1["Issued by: Backend"]
        OT2["Contains: userId, email, role"]
        OT3["Validity: configurable"]
        OT4["Purpose: API authorization"]
    end

    GOOGLE_TOKEN -->|"Exchanged for"| OUR_TOKEN
```

| Aspect   | Google ID Token             | Our JWT Token       |
| -------- | --------------------------- | ------------------- |
| Issuer   | Google                      | Our Backend         |
| Purpose  | Prove Google authentication | API authorization   |
| Contains | email, name, picture, etc.  | userId, email, role |
| Used for | One-time validation         | All API requests    |
| Validity | ~1 hour                     | Configurable        |

---

## Data Flow Diagram

```mermaid
flowchart TB
    subgraph INPUT["Input"]
        I1["Google ID Token<br/>─────────────<br/>eyJhbGciOi..."]
    end

    subgraph VALIDATION["Validation Layer"]
        V1["GoogleJsonWebSignature<br/>─────────────<br/>Verify signature<br/>Check expiration<br/>Validate issuer"]
    end

    subgraph EXTRACTION["Data Extraction"]
        E1["Payload<br/>─────────────<br/>Email: user@gmail.com<br/>Name: John Doe"]
    end

    subgraph USER_MGMT["User Management"]
        U1{"User exists?"}
        U2["Use existing user"]
        U3["Create new user"]
    end

    subgraph OUTPUT["Output"]
        O1["LoginResponseDto<br/>─────────────<br/>Token: eyJhbG...<br/>UserId: 5<br/>Email: user@gmail.com<br/>Role: User"]
    end

    INPUT --> VALIDATION --> EXTRACTION --> U1
    U1 -->|"Yes"| U2 --> OUTPUT
    U1 -->|"No"| U3 --> OUTPUT
```

---

## Error Handling Flow

```mermaid
flowchart TB
    subgraph REQUEST["POST /api/auth/google"]
        R1["{ idToken: '...' }"]
    end

    subgraph VALIDATION["Token Validation"]
        V1{"Token valid?"}
    end

    subgraph ERRORS["Possible Errors"]
        E1["Invalid signature"]
        E2["Token expired"]
        E3["Wrong issuer"]
        E4["Network error"]
    end

    subgraph RESPONSES["HTTP Responses"]
        S1["200 OK<br/>LoginResponseDto"]
        S2["400 Bad Request<br/>GOOGLE_AUTH_FAILED"]
    end

    REQUEST --> V1
    V1 -->|"Yes"| S1
    V1 -->|"No"| ERRORS --> S2
```

---

## File Structure

```
Backend/TaskCollaborationApp.API/
├── Controllers/
│   ├── AuthController.cs              ← POST /api/auth/google
│   └── DTOs/
│       └── Auth/
│           ├── GoogleAuthRequestDto.cs ← NEW
│           └── LoginResponseDto.cs     ← Reused
├── Services/
│   ├── Interfaces/
│   │   └── IAuthService.cs            ← + GoogleAuthAsync
│   ├── AuthService.cs                 ← + GoogleAuthAsync impl
│   └── JwtService.cs                  ← Reused
├── Repositories/
│   └── UserRepository.cs              ← FindByEmailAsync
└── TaskCollaborationApp.Api.csproj    ← + Google.Apis.Auth
```

---

## Related Documentation

- [00-development-plan.md](./00-development-plan.md) - Implementation details
- [02-design-patterns-and-solid.md](./02-design-patterns-and-solid.md) - Design patterns
- [03-programming-concepts.md](./03-programming-concepts.md) - Programming concepts
