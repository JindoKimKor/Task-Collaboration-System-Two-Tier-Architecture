# Design Patterns & SOLID Principles in Google OAuth

## GoF Design Patterns Applied

### 1. Strategy Pattern (Authentication Methods)

```mermaid
flowchart TB
    subgraph STRATEGY["Strategy Pattern"]
        direction TB

        subgraph CONTEXT["AuthController (Context)"]
            C1["Handles authentication requests"]
        end

        subgraph STRATEGIES["Authentication Strategies"]
            direction LR
            S1["Password Strategy<br/>─────────────<br/>POST /api/auth/login<br/>Verify with BCrypt"]
            S2["Google OAuth Strategy<br/>─────────────<br/>POST /api/auth/google<br/>Verify with Google"]
        end

        subgraph RESULT["Same Result"]
            R1["LoginResponseDto<br/>{ token, user }"]
        end
    end

    C1 --> S1 --> R1
    C1 --> S2 --> R1
```

**Where:** Multiple authentication methods in AuthController

**Why Strategy:**
- Different algorithms for same goal (authentication)
- Client chooses which strategy (endpoint) to use
- All strategies return same LoginResponseDto

---

### 2. Factory Pattern (User Creation)

```mermaid
flowchart TB
    subgraph FACTORY["Factory Pattern"]
        direction TB

        subgraph INPUT["Input Data"]
            direction LR
            I1["RegisterRequestDto<br/>─────────────<br/>name, email,<br/>username, password"]
            I2["Google Payload<br/>─────────────<br/>Email, Name<br/>(from Google)"]
        end

        subgraph CREATION["User Factory (AuthService)"]
            C1["Creates User entity<br/>based on input type"]
        end

        subgraph OUTPUT["Output"]
            direction LR
            O1["Password User<br/>─────────────<br/>PasswordHash = BCrypt"]
            O2["OAuth User<br/>─────────────<br/>PasswordHash = empty"]
        end
    end

    I1 -->|"RegisterAsync"| C1
    I2 -->|"GoogleAuthAsync"| C1
    C1 --> O1
    C1 --> O2
```

**Where:** `AuthService.GoogleAuthAsync()` creates OAuth users

**Why Factory:**
- Different user types from different inputs
- Encapsulates user creation logic
- Service decides how to construct User entity

---

### 3. Adapter Pattern (Google API Integration)

```mermaid
flowchart TB
    subgraph ADAPTER["Adapter Pattern"]
        direction TB

        subgraph TARGET["What We Need"]
            T1["email: string<br/>name: string"]
        end

        subgraph ADAPTER_CLASS["GoogleJsonWebSignature (Adapter)"]
            A1["ValidateAsync(idToken)<br/>─────────────<br/>Converts JWT to Payload"]
        end

        subgraph ADAPTEE["Google ID Token"]
            AD1["JWT string<br/>─────────────<br/>eyJhbGciOi..."]
        end
    end

    ADAPTEE -->|"ValidateAsync"| ADAPTER_CLASS
    ADAPTER_CLASS --> TARGET
```

**Where:** `GoogleJsonWebSignature.ValidateAsync()` converts Google JWT to usable payload

**Why Adapter:**
- Google returns opaque JWT string
- We need structured data (email, name)
- Adapter converts between incompatible interfaces

---

### 4. Facade Pattern (GoogleAuthAsync)

```mermaid
flowchart TB
    subgraph CLIENT["Client"]
        Controller["AuthController"]
    end

    subgraph FACADE["Facade: GoogleAuthAsync()"]
        Auth["AuthService<br/>─────────────<br/>Simple API:<br/>GoogleAuthAsync(idToken)"]
    end

    subgraph SUBSYSTEM["Subsystem"]
        direction TB
        Google["Google API"]
        UOW["UnitOfWork"]
        Repo["UserRepository"]
        JWT["JwtService"]
    end

    Controller -->|"GoogleAuthAsync(idToken)"| Auth
    Auth -->|"ValidateAsync"| Google
    Auth -->|"FindByEmailAsync"| UOW
    UOW --> Repo
    Auth -->|"GenerateToken"| JWT
```

**Where:** `GoogleAuthAsync` hides complexity of Google validation + user management

**Why Facade:**
- Controller doesn't know about Google API details
- Single method does: validate → find/create → generate token
- Easy to use: pass idToken, get LoginResponseDto

---

### 5. Null Object Pattern (User Lookup)

```mermaid
flowchart TB
    subgraph LOOKUP["FindByEmailAsync"]
        Query["Find user by email"]
        Result{{"Result"}}
        UserObj["User object"]
        NullVal["null"]
    end

    subgraph ACTION["Action Taken"]
        Use["Use existing user"]
        Create["Create new user"]
    end

    Query --> Result
    Result -->|"found"| UserObj --> Use
    Result -->|"not found"| NullVal --> Create
```

**Where:** User lookup in `GoogleAuthAsync`

**Why:**
- null means "create new user"
- Clear branching logic
- No exception for missing user (expected case)

---

### 6. Data Transfer Object (DTO) Pattern

```mermaid
flowchart LR
    subgraph REQUEST["Request DTO"]
        Req["GoogleAuthRequestDto<br/>─────────────<br/>IdToken: string"]
    end

    subgraph PROCESSING["Processing"]
        Service["GoogleAuthAsync()"]
    end

    subgraph RESPONSE["Response DTO"]
        Res["LoginResponseDto<br/>─────────────<br/>Token<br/>UserId<br/>Username<br/>Email<br/>Role"]
    end

    REQUEST --> PROCESSING --> RESPONSE
```

**Where:** `GoogleAuthRequestDto` and `LoginResponseDto`

**Why DTO:**
- Clear API contract
- Separate from domain entities
- Hide internal User structure (no PasswordHash)

---

## SOLID Principles Applied

### S - Single Responsibility Principle (SRP)

```mermaid
flowchart TB
    subgraph SRP["Single Responsibility"]
        direction LR

        subgraph DTO["GoogleAuthRequestDto"]
            D1["Carry ID token only"]
        end

        subgraph SERVICE["AuthService.GoogleAuthAsync"]
            S1["Orchestrate OAuth flow"]
        end

        subgraph GOOGLE["GoogleJsonWebSignature"]
            G1["Token validation only"]
        end

        subgraph JWT["JwtService"]
            J1["Token generation only"]
        end
    end
```

| Component | Single Responsibility |
|-----------|----------------------|
| GoogleAuthRequestDto | Carry Google ID token |
| GoogleJsonWebSignature | Validate token with Google |
| AuthService.GoogleAuthAsync | Orchestrate OAuth flow |
| JwtService | Generate our JWT token |
| UserRepository | Data access for users |

---

### O - Open/Closed Principle (OCP)

```mermaid
flowchart TB
    subgraph OCP["Open/Closed"]
        direction TB

        subgraph CLOSED["Closed for Modification"]
            Existing["Existing auth endpoints<br/>─────────────<br/>/register<br/>/login<br/>/me"]
        end

        subgraph OPEN["Open for Extension"]
            New["New endpoint added<br/>─────────────<br/>/google ← NEW<br/>(no existing code changed)"]
        end
    end

    Existing -.->|"unchanged"| New
```

**Where Applied:**
- Added `/google` endpoint without changing `/login` or `/register`
- Added `GoogleAuthAsync` without modifying existing methods
- `IAuthService` interface extended, not changed

---

### L - Liskov Substitution Principle (LSP)

```mermaid
flowchart TB
    subgraph LSP["Liskov Substitution"]
        Result["LoginResponseDto"]

        subgraph METHODS["Auth Methods"]
            M1["RegisterAsync()"]
            M2["LoginAsync()"]
            M3["GoogleAuthAsync()"]
        end
    end

    M1 --> Result
    M2 --> Result
    M3 --> Result
```

**Where Applied:**
- All auth methods return `LoginResponseDto`
- Client code works the same regardless of auth method
- Can substitute one auth method for another

---

### I - Interface Segregation Principle (ISP)

```mermaid
flowchart TB
    subgraph ISP["Interface Segregation"]
        direction TB

        subgraph AUTH["IAuthService"]
            A1["RegisterAsync()"]
            A2["LoginAsync()"]
            A3["GetCurrentUserAsync()"]
            A4["GoogleAuthAsync() ← NEW"]
        end

        subgraph SEPARATE["Separated Concerns"]
            S1["IJwtService<br/>GenerateToken()"]
            S2["IUserRepository<br/>FindByEmailAsync()"]
        end
    end
```

**Where Applied:**
- `IAuthService` has auth methods only
- `IJwtService` has token methods only
- Google API accessed directly (static method, no DI needed)

---

### D - Dependency Inversion Principle (DIP)

```mermaid
flowchart TB
    subgraph DIP["Dependency Inversion"]
        direction TB

        subgraph HIGH["High-Level"]
            Controller["AuthController"]
        end

        subgraph ABSTRACTION["Abstractions"]
            IAuth["IAuthService"]
        end

        subgraph LOW["Low-Level"]
            Service["AuthService"]
            Google["Google.Apis.Auth"]
            UoW["UnitOfWork"]
        end
    end

    Controller -->|"depends on"| IAuth
    Service -.->|"implements"| IAuth
    Service -->|"uses"| Google
    Service -->|"uses"| UoW
```

**Where Applied:**
- Controller depends on `IAuthService` interface
- Controller doesn't know about Google API or UnitOfWork
- DI Container injects AuthService at runtime

---

## Summary Table

| Pattern/Principle | Where Applied | Benefit |
|-------------------|---------------|---------|
| **Strategy** | Multiple auth endpoints | Same result, different methods |
| **Factory** | User creation | Password vs OAuth users |
| **Adapter** | Google API | Convert JWT to payload |
| **Facade** | GoogleAuthAsync | Hide OAuth complexity |
| **Null Object** | User lookup | Create if not exists |
| **DTO** | Request/Response | Clear API contract |
| **SRP** | Separate concerns | Each class has one job |
| **OCP** | New endpoint | No existing code changed |
| **LSP** | Auth methods | All return same type |
| **ISP** | Focused interfaces | Auth-related methods only |
| **DIP** | Constructor injection | Loose coupling |

---

## Related Documentation

- [00-development-plan.md](./00-development-plan.md) - Implementation details
- [02-programming-concepts.md](./02-programming-concepts.md) - Programming concepts
