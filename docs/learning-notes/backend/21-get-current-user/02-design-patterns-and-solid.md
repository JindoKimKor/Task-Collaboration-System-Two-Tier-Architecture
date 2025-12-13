# Design Patterns & SOLID Principles in Get Current User

## GoF Design Patterns Applied

### 1. Chain of Responsibility Pattern (Middleware Pipeline)

```mermaid
flowchart LR
    subgraph CHAIN["Chain of Responsibility"]
        direction LR
        Request["HTTP Request"]
        H1["CORS Middleware"]
        H2["JWT Middleware"]
        H3["Authorization Middleware"]
        H4["Controller"]
        Response["HTTP Response"]

        Request --> H1 --> H2 --> H3 --> H4 --> Response
    end
```

**Where:** ASP.NET Core middleware pipeline

**Why Chain of Responsibility:**
- Each middleware decides to handle or pass to next
- JWT Middleware can short-circuit with 401 if token invalid
- Authorization Middleware can reject if not authenticated
- Order matters: Authentication before Authorization

```csharp
// Program.cs - Chain order
app.UseAuthentication();  // Handler 1: Validate JWT
app.UseAuthorization();   // Handler 2: Check [Authorize]
app.MapControllers();     // Handler 3: Route to action
```

---

### 2. Decorator Pattern (Claims Population)

```mermaid
flowchart TB
    subgraph DECORATOR["Decorator Pattern"]
        direction TB

        subgraph ORIGINAL["Original Request"]
            R1["HttpContext<br/>─────────────<br/>User = empty"]
        end

        subgraph DECORATED["After JWT Middleware"]
            R2["HttpContext<br/>─────────────<br/>User.Claims = [<br/>  NameIdentifier,<br/>  Email,<br/>  Name,<br/>  Role<br/>]"]
        end
    end

    ORIGINAL -->|"JWT Middleware decorates"| DECORATED
```

**Where:** JWT Middleware populating `HttpContext.User.Claims`

**Why Decorator:**
- Original HttpContext is enhanced without modification
- Claims are added transparently
- Controller receives enriched context

---

### 3. Facade Pattern (AuthService.GetCurrentUserAsync)

```mermaid
flowchart TB
    subgraph CLIENT["Client"]
        Controller["AuthController"]
    end

    subgraph FACADE["Facade: GetCurrentUserAsync()"]
        Auth["AuthService<br/>─────────────<br/>Simple API:<br/>GetCurrentUserAsync(userId)"]
    end

    subgraph SUBSYSTEM["Subsystem"]
        direction TB
        UOW["IUnitOfWork"]
        Repo["UserRepository"]
        DB[(Database)]
    end

    Controller -->|"GetCurrentUserAsync(userId)"| Auth
    Auth -->|"Users.GetByIdAsync()"| UOW
    UOW --> Repo
    Repo --> DB
```

**Where:** `AuthService.GetCurrentUserAsync()` method

**Why Facade:**
- Controller doesn't know about UnitOfWork or Repository
- Single method hides data access complexity
- Easy to use: just pass userId, get UserDto

---

### 4. Data Transfer Object (DTO) Pattern

```mermaid
flowchart LR
    subgraph ENTITY["Domain Entity"]
        User["User<br/>─────────────<br/>Id<br/>Name<br/>Username<br/>Email<br/>PasswordHash ⚠️<br/>Role<br/>CreatedAt"]
    end

    subgraph DTO["Response DTO"]
        UserDto["UserDto<br/>─────────────<br/>Id<br/>Name<br/>Username<br/>Email<br/>Role<br/>CreatedAt<br/>(no PasswordHash!)"]
    end

    User -->|"mapped by service"| UserDto
```

**Where:** `UserDto` returned by GET /api/auth/me

**Why DTO:**
- Never expose PasswordHash to client
- Different shape than entity (no navigation properties)
- Can change entity without breaking API contract

---

### 5. Null Object Pattern (User Not Found)

```mermaid
flowchart TB
    subgraph LOOKUP["GetCurrentUserAsync"]
        Query["GetByIdAsync(userId)"]
        Result{{"Result"}}
        UserObj["User object"]
        NullVal["null"]
    end

    subgraph RESPONSE["Controller Response"]
        Ok["Return Ok(userDto)"]
        NotFound["Return NotFound()"]
    end

    Query --> Result
    Result -->|"found"| UserObj --> Ok
    Result -->|"not found"| NullVal --> NotFound
```

**Where:** User lookup returns `null` if user deleted

**Why:**
- Explicit null check in controller
- Clear 404 response for missing user
- Handles edge case: token valid but user deleted

---

### 6. Template Method Pattern (Service Methods)

```mermaid
flowchart TB
    subgraph TEMPLATE["Template: Auth Service Methods"]
        direction TB
        T1["1. Get User from Repository"]
        T2["2. Check if null"]
        T3["3. Create Response DTO"]
        T4["4. Return DTO"]
    end

    subgraph LOGIN["LoginAsync"]
        L1["1. FindByEmailOrUsername"]
        L2["2. Validate password"]
        L3["3. Generate token + DTO"]
        L4["4. Return LoginResponseDto"]
    end

    subgraph GETME["GetCurrentUserAsync"]
        G1["1. GetByIdAsync"]
        G2["2. Check null"]
        G3["3. Map to UserDto"]
        G4["4. Return UserDto"]
    end

    TEMPLATE -->|"login variant"| LOGIN
    TEMPLATE -->|"get me variant"| GETME
```

**Where:** `LoginAsync` and `GetCurrentUserAsync` share similar pattern

---

## SOLID Principles Applied

### S - Single Responsibility Principle (SRP)

```mermaid
flowchart TB
    subgraph SRP["Single Responsibility"]
        direction LR

        subgraph JWT["JWT Middleware"]
            J1["Token validation only<br/>─────────────<br/>Parse JWT<br/>Populate claims"]
        end

        subgraph CONTROLLER["AuthController"]
            C1["HTTP concerns only<br/>─────────────<br/>Extract claims<br/>Call service<br/>Return status"]
        end

        subgraph SERVICE["AuthService"]
            S1["Data retrieval only<br/>─────────────<br/>Fetch from repo<br/>Map to DTO"]
        end
    end
```

| Component | Single Responsibility |
|-----------|----------------------|
| JWT Middleware | Token validation, claims population |
| [Authorize] Attribute | Check if authenticated |
| AuthController | HTTP routing, claims extraction |
| AuthService | User data retrieval |
| UserDto | API response structure |

---

### O - Open/Closed Principle (OCP)

```mermaid
flowchart TB
    subgraph OCP["Open/Closed"]
        direction TB

        subgraph CLOSED["Closed for Modification"]
            Service["GetCurrentUserAsync<br/>─────────────<br/>Same logic regardless of<br/>how token was obtained"]
        end

        subgraph OPEN["Open for Extension"]
            direction LR
            JWT["JWT Login"]
            Google["Google OAuth (future)"]
            Refresh["Refresh Token (future)"]
        end
    end

    OPEN -->|"all use same"| CLOSED
```

**Where Applied:**
- `GetCurrentUserAsync` doesn't care how user was authenticated
- Same endpoint works for JWT login, Google OAuth, etc.
- New auth methods don't require changes to /me endpoint

---

### L - Liskov Substitution Principle (LSP)

```mermaid
flowchart TB
    subgraph LSP["Liskov Substitution"]
        Interface["IAuthService<br/>─────────────<br/>GetCurrentUserAsync()"]

        subgraph IMPLEMENTATIONS["Any implementation works"]
            Real["AuthService"]
            Mock["MockAuthService"]
            Cached["CachedAuthService (future)"]
        end
    end

    Interface --> IMPLEMENTATIONS
```

**Where Applied:**
- Controller depends on `IAuthService` interface
- Any implementation returning `UserDto?` is valid
- Can mock for unit testing

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
        end

        subgraph FUTURE["Future Interfaces"]
            I1["IGoogleAuthService<br/>LoginWithGoogleAsync()"]
            I2["IRefreshTokenService<br/>RefreshTokenAsync()"]
        end
    end
```

**Where Applied:**
- `IAuthService` contains only auth-related methods
- Controller doesn't depend on JWT internals
- If Google OAuth added, separate interface

---

### D - Dependency Inversion Principle (DIP)

```mermaid
flowchart TB
    subgraph DIP["Dependency Inversion"]
        direction TB

        subgraph HIGH["High-Level"]
            Controller["AuthController"]
        end

        subgraph ABSTRACTION["Abstraction"]
            IAuth["IAuthService"]
        end

        subgraph LOW["Low-Level"]
            Service["AuthService"]
            UoW["UnitOfWork"]
            Repo["UserRepository"]
        end
    end

    Controller -->|"depends on"| IAuth
    Service -.->|"implements"| IAuth
    Service -->|"uses"| UoW
    UoW -->|"contains"| Repo
```

**Where Applied:**
- Controller receives `IAuthService` via constructor injection
- Controller doesn't know about `UnitOfWork` or `UserRepository`
- DI Container wires everything at startup

---

## Summary Table

| Pattern/Principle | Where Applied | Benefit |
|-------------------|---------------|---------|
| **Chain of Responsibility** | Middleware pipeline | Sequential request processing |
| **Decorator** | JWT claims population | Enhance HttpContext transparently |
| **Facade** | GetCurrentUserAsync | Simple API, hide data access |
| **DTO** | UserDto | Hide sensitive data, decouple API |
| **Null Object** | User not found | Explicit 404 handling |
| **Template Method** | Auth service methods | Shared structure, varying details |
| **SRP** | Separate concerns | Each class has one job |
| **OCP** | Auth method agnostic | Same endpoint, any auth method |
| **LSP** | IAuthService | Mockable, testable |
| **ISP** | Focused interfaces | No unused dependencies |
| **DIP** | Constructor injection | Loose coupling |

---

## Related Documentation

- [00-development-plan.md](./00-development-plan.md) - Implementation details
- [01-architecture-diagram.md](./01-architecture-diagram.md) - System architecture
- [03-programming-concepts.md](./03-programming-concepts.md) - Programming concepts
