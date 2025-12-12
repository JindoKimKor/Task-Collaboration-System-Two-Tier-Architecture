# Design Patterns & SOLID Principles in Auth Service

## GoF Design Patterns Applied

### 1. Strategy Pattern (IJwtService)

```mermaid
flowchart TB
    subgraph CONTEXT["Context: AuthService"]
        Auth["AuthService<br/>─────────────<br/>-IJwtService _jwtService"]
    end

    subgraph STRATEGY["Strategy Interface"]
        IJwt["IJwtService<br/>─────────────<br/>+GenerateToken(User)"]
    end

    subgraph CONCRETE["Concrete Strategies"]
        direction LR
        JwtService["JwtService<br/>(Current: HS256)"]
        GoogleJwt["GoogleJwtService<br/>(Future: OAuth)"]
        AzureJwt["AzureJwtService<br/>(Future: Azure AD)"]
    end

    Auth -->|uses| STRATEGY
    JwtService -.->|implements| IJwt
    GoogleJwt -.->|implements| IJwt
    AzureJwt -.->|implements| IJwt
```

**Where:** `IJwtService` with `JwtService` implementation

**Why Strategy:**
- `AuthService` doesn't know HOW tokens are generated
- Can swap `JwtService` with different implementations (OAuth, Azure AD) without changing `AuthService`
- Algorithm (token generation) is encapsulated and interchangeable

```csharp
// AuthService doesn't care which strategy is used
public class AuthService : IAuthService
{
    private readonly IJwtService _jwtService;  // Strategy interface

    public async Task<LoginResponseDto> RegisterAsync(...)
    {
        // ... registration logic
        var token = _jwtService.GenerateToken(user);  // Delegated to strategy
    }
}
```

---

### 2. Facade Pattern (AuthService)

```mermaid
flowchart TB
    subgraph CLIENT["Client"]
        Controller["AuthController"]
    end

    subgraph FACADE["Facade: AuthService"]
        Auth["AuthService<br/>─────────────<br/>RegisterAsync()<br/>─────────────<br/>Provides simple API<br/>for complex auth flow"]
    end

    subgraph SUBSYSTEM["Complex Subsystem"]
        direction LR
        UOW["IUnitOfWork"]
        Jwt["IJwtService"]
        BCrypt["BCrypt"]
        Config["IConfiguration"]
    end

    Controller -->|simple API| Auth
    Auth -->|coordinates| UOW
    Auth -->|delegates| Jwt
    Auth -->|uses| BCrypt
    Auth -->|reads| Config
```

**Where:** `AuthService` wraps multiple dependencies

**Why Facade:**
- Controller only knows `IAuthService.RegisterAsync()`
- Hides complexity: duplicate check, password hashing, role assignment, token generation
- Single entry point for authentication operations

---

### 3. Factory Method Pattern (JwtService.GenerateToken)

```mermaid
flowchart TB
    subgraph FACTORY["Factory: JwtService"]
        Method["GenerateToken(User)<br/>─────────────<br/>Creates JWT token<br/>without exposing creation logic"]
    end

    subgraph PRODUCT["Product: JWT Token"]
        Token["JwtSecurityToken<br/>─────────────<br/>Claims<br/>Expiration<br/>Signature"]
    end

    subgraph STEPS["Creation Steps (Hidden)"]
        direction TB
        S1["1. Create Claims[]"]
        S2["2. Create SecurityKey"]
        S3["3. Create Credentials"]
        S4["4. Create JwtSecurityToken"]
        S5["5. Serialize to string"]
    end

    Method -->|creates| Product
    Method -->|encapsulates| STEPS
```

**Where:** `JwtService.GenerateToken()` creates JWT tokens

**Why Factory Method:**
- Client (`AuthService`) doesn't know JWT creation details
- Complex creation logic is encapsulated
- Returns a "product" (JWT string) from a "factory" (JwtService)

---

### 4. Options Pattern (JwtSettings)

```mermaid
flowchart LR
    subgraph SOURCE["Configuration Source"]
        JSON["appsettings.json<br/>─────────────<br/>JwtSettings section"]
    end

    subgraph BINDING["Options Pattern"]
        IOptions["IOptions‹JwtSettings›<br/>─────────────<br/>Type-safe configuration"]
    end

    subgraph CONSUMER["Consumer"]
        JwtService["JwtService<br/>─────────────<br/>_jwtSettings.SecretKey<br/>_jwtSettings.Issuer<br/>..."]
    end

    JSON -->|binds to| IOptions
    IOptions -->|injected into| JwtService
```

**Where:** `JwtSettings` configuration class with `IOptions<JwtSettings>`

**Why Options Pattern:**
- Type-safe configuration (no magic strings)
- Compile-time checking
- Separation of configuration from code
- Microsoft recommended pattern for configuration

---

## SOLID Principles Applied

### S - Single Responsibility Principle (SRP)

```mermaid
flowchart TB
    subgraph BEFORE["Without SRP (Original Plan)"]
        BadAuth["AuthService<br/>─────────────<br/>- Registration logic<br/>- Password hashing<br/>- JWT generation<br/>- Token signing<br/>- Claims creation"]
    end

    subgraph AFTER["With SRP (Actual Implementation)"]
        direction TB
        GoodAuth["AuthService<br/>─────────────<br/>Registration logic only"]
        GoodJwt["JwtService<br/>─────────────<br/>JWT generation only"]
        BCrypt["BCrypt<br/>─────────────<br/>Password hashing only"]
    end
```

**Where Applied:**
| Class | Single Responsibility |
|-------|----------------------|
| `AuthService` | Authentication business logic (registration flow) |
| `JwtService` | JWT token generation only |
| `JwtSettings` | JWT configuration data only |
| `RegisterRequestDto` | Registration input data only |
| `LoginResponseDto` | Login response data only |

**Why Separated JwtService:**
- Original plan: `GenerateJwtToken()` as private method in `AuthService`
- Actual: Separate `JwtService` class
- Reason: JWT generation is independent responsibility, reusable by other services

---

### O - Open/Closed Principle (OCP)

```mermaid
flowchart TB
    subgraph OCP["Open for Extension, Closed for Modification"]
        direction TB

        subgraph CLOSED["Closed for Modification"]
            AuthService["AuthService<br/>─────────────<br/>Uses IJwtService<br/>Don't modify for new token types"]
        end

        subgraph OPEN["Open for Extension"]
            direction LR
            Jwt1["JwtService<br/>(HS256)"]
            Jwt2["RS256JwtService<br/>(RSA)"]
            Jwt3["AzureJwtService<br/>(Azure AD)"]
        end
    end

    AuthService -->|uses| IJwtService["IJwtService"]
    Jwt1 -.->|implements| IJwtService
    Jwt2 -.->|implements| IJwtService
    Jwt3 -.->|implements| IJwtService
```

**Where Applied:**
- Adding new token generation strategy doesn't modify `AuthService`
- Adding new auth methods (LoginAsync) extends `IAuthService` without modifying existing

---

### L - Liskov Substitution Principle (LSP)

```mermaid
flowchart LR
    subgraph LSP["Liskov Substitution"]
        Interface["IJwtService"]

        subgraph SUBSTITUTABLE["Can substitute any implementation"]
            Real["JwtService"]
            Mock["MockJwtService"]
            Test["TestJwtService"]
        end
    end

    Interface -->|any of these work| SUBSTITUTABLE
```

**Where Applied:**
- Any `IJwtService` implementation can replace `JwtService`
- Any `IAuthService` implementation can replace `AuthService`
- Mock implementations work for unit testing

---

### I - Interface Segregation Principle (ISP)

```mermaid
flowchart TB
    subgraph ISP["Interface Segregation"]
        direction TB

        subgraph SEGREGATED["Segregated Interfaces"]
            IAuth["IAuthService<br/>─────────────<br/>RegisterAsync()"]
            IJwt["IJwtService<br/>─────────────<br/>GenerateToken()"]
        end
    end
```

**Where Applied:**
- `IAuthService` - only authentication methods
- `IJwtService` - only token generation methods
- Services depend only on interfaces they use
- `AuthController` depends only on `IAuthService`, not `IJwtService`

---

### D - Dependency Inversion Principle (DIP)

```mermaid
flowchart TB
    subgraph DIP["Dependency Inversion"]
        direction TB

        subgraph HIGHLEVEL["High-Level Module"]
            AuthService["AuthService"]
        end

        subgraph ABSTRACTIONS["Abstractions"]
            IUnitOfWork["IUnitOfWork"]
            IJwtService["IJwtService"]
            IConfiguration["IConfiguration"]
        end

        subgraph LOWLEVEL["Low-Level Modules"]
            UnitOfWork["UnitOfWork"]
            JwtService["JwtService"]
            Configuration["Configuration"]
        end
    end

    AuthService -->|depends on| IUnitOfWork
    AuthService -->|depends on| IJwtService
    AuthService -->|depends on| IConfiguration
    UnitOfWork -.->|implements| IUnitOfWork
    JwtService -.->|implements| IJwtService
```

**Where Applied:**
- `AuthService` depends on `IJwtService` (abstraction), not `JwtService` (concrete)
- `JwtService` depends on `IOptions<JwtSettings>` (abstraction)
- DI Container wires concrete implementations

```csharp
// Constructor injection - all abstractions
public AuthService(
    IUnitOfWork unitOfWork,      // Abstraction
    IJwtService jwtService,       // Abstraction
    IConfiguration configuration) // Abstraction
```

---

## Summary Table

| Pattern/Principle | Where Applied | Benefit |
|-------------------|---------------|---------|
| **Strategy** | IJwtService → JwtService | Swappable token generation |
| **Facade** | AuthService | Simple API, hide complexity |
| **Factory Method** | JwtService.GenerateToken() | Encapsulated token creation |
| **Options Pattern** | IOptions‹JwtSettings› | Type-safe configuration |
| **SRP** | AuthService, JwtService separated | Single responsibility each |
| **OCP** | IJwtService implementations | Extend without modify |
| **LSP** | Interface implementations | Substitutable, mockable |
| **ISP** | IAuthService, IJwtService | Focused interfaces |
| **DIP** | Constructor injection | Loose coupling, testable |
