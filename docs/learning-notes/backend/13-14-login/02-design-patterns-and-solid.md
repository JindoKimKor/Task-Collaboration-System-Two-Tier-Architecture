# Design Patterns & SOLID Principles in Login Implementation

## GoF Design Patterns Applied

### 1. Template Method Pattern (LoginAsync vs RegisterAsync)

```mermaid
flowchart TB
    subgraph TEMPLATE["Template Method Pattern"]
        direction TB

        subgraph ABSTRACT["Abstract Algorithm (AuthService)"]
            A1["1. Find/Create User"]
            A2["2. Validate Credentials"]
            A3["3. Generate Token"]
            A4["4. Return Response"]
        end

        subgraph LOGIN["LoginAsync Implementation"]
            L1["1. FindByEmailOrUsername"]
            L2["2. BCrypt.Verify()"]
            L3["3. GenerateToken()"]
            L4["4. LoginResponseDto"]
        end

        subgraph REGISTER["RegisterAsync Implementation"]
            R1["1. Check duplicates + Create User"]
            R2["2. BCrypt.HashPassword()"]
            R3["3. GenerateToken()"]
            R4["4. LoginResponseDto"]
        end
    end

    ABSTRACT -->|"login variant"| LOGIN
    ABSTRACT -->|"register variant"| REGISTER
```

**Where:** `AuthService.LoginAsync()` and `AuthService.RegisterAsync()` share common steps

**Why Template Method:**
- Both methods follow same skeleton: user operation → credential operation → token → response
- Step 3 and 4 are identical (reuse `_jwtService.GenerateToken()` and `LoginResponseDto`)
- Variation only in steps 1-2 (find vs create, verify vs hash)

---

### 2. Strategy Pattern (IJwtService)

```mermaid
flowchart TB
    subgraph CONTEXT["Context: AuthService"]
        Auth["AuthService<br/>─────────────<br/>LoginAsync()<br/>RegisterAsync()"]
    end

    subgraph STRATEGY["Strategy Interface"]
        IJwt["IJwtService<br/>─────────────<br/>+GenerateToken(User)"]
    end

    subgraph CONCRETE["Concrete Strategies"]
        direction LR
        JwtService["JwtService<br/>(Current: HS256)"]
        GoogleJwt["GoogleJwtService<br/>(Future: OAuth)"]
    end

    Auth -->|"delegates token generation"| STRATEGY
    JwtService -.->|implements| IJwt
    GoogleJwt -.->|implements| IJwt
```

**Where:** `IJwtService` used by both `LoginAsync` and `RegisterAsync`

**Why Strategy:**
- AuthService doesn't know HOW tokens are generated
- Same strategy used for both login and registration
- Token generation algorithm is encapsulated and interchangeable

---

### 3. Facade Pattern (AuthService as Facade)

```mermaid
flowchart TB
    subgraph CLIENT["Client"]
        Controller["AuthController"]
    end

    subgraph FACADE["Facade: AuthService.LoginAsync()"]
        Auth["AuthService<br/>─────────────<br/>Simple login API<br/>Hides complexity"]
    end

    subgraph SUBSYSTEM["Complex Subsystem"]
        direction TB
        UOW["IUnitOfWork<br/>→ UserRepository"]
        BCrypt["BCrypt.Net<br/>→ Verify()"]
        Jwt["IJwtService<br/>→ GenerateToken()"]
    end

    Controller -->|"LoginAsync(request)"| Auth
    Auth -->|"FindByEmailOrUsernameAsync()"| UOW
    Auth -->|"Verify(password, hash)"| BCrypt
    Auth -->|"GenerateToken(user)"| Jwt
```

**Where:** `AuthService.LoginAsync()` coordinates multiple subsystems

**Why Facade:**
- Controller only calls one method: `LoginAsync()`
- Hides complexity: user lookup, password verification, token generation
- Single entry point for login operation

---

### 4. Null Object Pattern (Error Handling)

```mermaid
flowchart TB
    subgraph LOOKUP["User Lookup"]
        Query["FindByEmailOrUsernameAsync()"]
        Result{{"Result"}}
        UserObj["User object"]
        NullVal["null"]
    end

    subgraph HANDLING["Handling"]
        Process["Continue to BCrypt verify"]
        Throw["throw UnauthorizedAccessException"]
    end

    Query --> Result
    Result -->|"found"| UserObj --> Process
    Result -->|"not found"| NullVal --> Throw
```

**Where:** User lookup returns `null` for non-existent user

**Why This Approach:**
- Explicit null check before proceeding
- Same exception for "user not found" and "wrong password"
- Prevents user enumeration attacks (same error message)

---

### 5. Data Transfer Object (DTO) Pattern

```mermaid
flowchart LR
    subgraph INPUT["Request DTO"]
        LoginReq["LoginRequestDto<br/>─────────────<br/>UsernameOrEmail<br/>Password"]
    end

    subgraph ENTITY["Domain Entity"]
        User["User<br/>─────────────<br/>Id<br/>Username<br/>Email<br/>PasswordHash ⚠️<br/>Role<br/>CreatedAt"]
    end

    subgraph OUTPUT["Response DTO"]
        LoginRes["LoginResponseDto<br/>─────────────<br/>Token<br/>UserId<br/>Username<br/>Email<br/>Role<br/>(no PasswordHash!)"]
    end

    INPUT -->|"used to find"| User
    User -->|"mapped to"| OUTPUT
```

**Where:** `LoginRequestDto` and `LoginResponseDto`

**Why DTO:**
- Decouple API contract from entity structure
- Hide sensitive data (PasswordHash never returned)
- Validation attributes on DTO, not entity

---

## SOLID Principles Applied

### S - Single Responsibility Principle (SRP)

```mermaid
flowchart TB
    subgraph SRP["Single Responsibility - Each Class"]
        direction LR

        subgraph CONTROLLER["AuthController"]
            C1["HTTP concerns only<br/>─────────────<br/>Routing<br/>Status codes<br/>Exception → HTTP"]
        end

        subgraph SERVICE["AuthService"]
            S1["Auth logic only<br/>─────────────<br/>Credential validation<br/>Flow coordination"]
        end

        subgraph JWT["JwtService"]
            J1["Token only<br/>─────────────<br/>Generate JWT<br/>Claims creation"]
        end

        subgraph REPO["UserRepository"]
            R1["Data access only<br/>─────────────<br/>FindByEmailOrUsername<br/>EF Core queries"]
        end
    end
```

| Class | Single Responsibility |
|-------|----------------------|
| `AuthController.Login` | HTTP routing, status code mapping |
| `AuthService.LoginAsync` | Login business logic |
| `JwtService` | Token generation |
| `UserRepository` | User data access |
| `LoginRequestDto` | Input data structure |

---

### O - Open/Closed Principle (OCP)

```mermaid
flowchart TB
    subgraph OCP["Open/Closed"]
        direction TB

        subgraph CLOSED["Closed for Modification"]
            AuthService["AuthService<br/>─────────────<br/>Login logic unchanged<br/>when adding new auth methods"]
        end

        subgraph OPEN["Open for Extension"]
            direction LR
            Method1["LoginAsync()<br/>(username/email)"]
            Method2["LoginWithGoogleAsync()<br/>(future OAuth)"]
            Method3["LoginWith2FAAsync()<br/>(future 2FA)"]
        end
    end

    CLOSED --> OPEN
```

**Where Applied:**
- New auth methods can be added to `IAuthService` without modifying `LoginAsync`
- New JWT strategies implement `IJwtService` without modifying existing

---

### L - Liskov Substitution Principle (LSP)

```mermaid
flowchart LR
    subgraph LSP["Liskov Substitution"]
        direction TB

        Interface["IAuthService<br/>─────────────<br/>LoginAsync()"]

        subgraph SUBS["Any implementation works"]
            Real["AuthService"]
            Mock["MockAuthService"]
            Test["TestAuthService"]
        end
    end

    Interface -->|"substitutable"| SUBS
```

**Where Applied:**
- Any `IAuthService` implementation can be injected into `AuthController`
- Mock implementation for unit testing
- All return `LoginResponseDto` or throw `UnauthorizedAccessException`

---

### I - Interface Segregation Principle (ISP)

```mermaid
flowchart TB
    subgraph ISP["Interface Segregation"]
        direction TB

        subgraph INTERFACES["Focused Interfaces"]
            IAuth["IAuthService<br/>─────────────<br/>RegisterAsync()<br/>LoginAsync()"]
            IJwt["IJwtService<br/>─────────────<br/>GenerateToken()"]
            IUserRepo["IUserRepository<br/>─────────────<br/>FindByEmailOrUsernameAsync()<br/>ExistsAsync()"]
        end

        subgraph CLIENTS["Clients depend only on what they need"]
            Controller["AuthController<br/>uses only IAuthService"]
            Service["AuthService<br/>uses IJwtService + IUnitOfWork"]
        end
    end

    INTERFACES --> CLIENTS
```

**Where Applied:**
- `AuthController` only depends on `IAuthService`
- `AuthController` doesn't know about `IJwtService` or `IUserRepository`
- Each interface has focused methods

---

### D - Dependency Inversion Principle (DIP)

```mermaid
flowchart TB
    subgraph DIP["Dependency Inversion"]
        direction TB

        subgraph HIGH["High-Level Modules"]
            Controller["AuthController"]
            Service["AuthService"]
        end

        subgraph ABSTRACTIONS["Abstractions"]
            IAuth["IAuthService"]
            IJwt["IJwtService"]
            IUoW["IUnitOfWork"]
        end

        subgraph LOW["Low-Level Modules"]
            AuthImpl["AuthService impl"]
            JwtImpl["JwtService impl"]
            UoWImpl["UnitOfWork impl"]
        end
    end

    Controller -->|"depends on"| IAuth
    Service -->|"depends on"| IJwt
    Service -->|"depends on"| IUoW
    AuthImpl -.->|"implements"| IAuth
    JwtImpl -.->|"implements"| IJwt
    UoWImpl -.->|"implements"| IUoW
```

**Where Applied:**
- `AuthController` constructor receives `IAuthService` (abstraction)
- `AuthService` constructor receives `IJwtService`, `IUnitOfWork` (abstractions)
- DI Container wires concrete implementations at runtime

---

## Summary Table

| Pattern/Principle | Where Applied | Benefit |
|-------------------|---------------|---------|
| **Template Method** | LoginAsync / RegisterAsync | Shared skeleton, varying steps |
| **Strategy** | IJwtService | Swappable token generation |
| **Facade** | AuthService.LoginAsync | Simple API, hide complexity |
| **DTO** | LoginRequestDto / ResponseDto | Decouple API from entity |
| **SRP** | Separate classes | Single reason to change |
| **OCP** | IAuthService interface | Extend without modify |
| **LSP** | Interface implementations | Substitutable, mockable |
| **ISP** | Focused interfaces | No unused dependencies |
| **DIP** | Constructor injection | Loose coupling, testable |

---

## Related Documentation

- [00-development-plan.md](./00-development-plan.md) - Implementation details
- [01-architecture-diagram.md](./01-architecture-diagram.md) - System architecture
- [03-programming-concepts.md](./03-programming-concepts.md) - Programming concepts
