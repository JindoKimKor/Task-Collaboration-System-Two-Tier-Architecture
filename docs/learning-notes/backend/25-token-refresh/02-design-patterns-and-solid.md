# Design Patterns & SOLID Principles in Token Refresh

## GoF Design Patterns Applied

### 1. Strategy Pattern (Token Generation)

```mermaid
flowchart TB
    subgraph STRATEGY["Strategy Pattern"]
        direction TB

        subgraph CONTEXT["AuthService (Context)"]
            C1["Needs to generate tokens"]
        end

        subgraph STRATEGIES["Token Strategies"]
            direction LR
            S1["Access Token Strategy<br/>─────────────<br/>JwtService.GenerateToken()<br/>JWT with claims"]
            S2["Refresh Token Strategy<br/>─────────────<br/>GenerateRefreshToken()<br/>Random hex string"]
        end

        subgraph RESULT["Both Used Together"]
            R1["LoginResponseDto<br/>{ token, refreshToken }"]
        end
    end

    C1 --> S1 --> R1
    C1 --> S2 --> R1
```

**Where:** AuthService uses two different token generation strategies

**Why Strategy:**
- Different algorithms for different token types
- JWT for access (stateless, self-contained)
- Random string for refresh (server-validated)
- Both strategies produce tokens, but with different characteristics

---

### 2. Template Method Pattern (Auth Flow)

```mermaid
flowchart TB
    subgraph TEMPLATE["Template Method Pattern"]
        direction TB

        subgraph ABSTRACT["Abstract Auth Flow"]
            T1["1. Authenticate user"]
            T2["2. Generate access token"]
            T3["3. Generate refresh token"]
            T4["4. Return LoginResponseDto"]
        end

        subgraph CONCRETE["Concrete Implementations"]
            direction LR
            C1["RegisterAsync<br/>─────────────<br/>Auth: Create user"]
            C2["LoginAsync<br/>─────────────<br/>Auth: Verify password"]
            C3["GoogleAuthAsync<br/>─────────────<br/>Auth: Validate Google"]
            C4["RefreshTokenAsync<br/>─────────────<br/>Auth: Validate refresh"]
        end
    end

    ABSTRACT --> CONCRETE
```

**Where:** All auth methods follow same pattern but vary in authentication step

**Why Template Method:**
- Steps 2-4 are identical across all methods
- Only Step 1 (authentication) differs
- Code reuse via helper methods (GenerateRefreshToken)

---

### 3. Flyweight Pattern (Token Storage)

```mermaid
flowchart TB
    subgraph FLYWEIGHT["Flyweight Pattern"]
        direction TB

        subgraph INTRINSIC["Shared State (static)"]
            F1["ConcurrentDictionary<br/>─────────────<br/>Shared across all requests<br/>Single instance in memory"]
        end

        subgraph EXTRINSIC["Per-Request State"]
            E1["Request 1: Token A"]
            E2["Request 2: Token B"]
            E3["Request 3: Token C"]
        end
    end

    E1 -->|"Lookup/Store"| F1
    E2 -->|"Lookup/Store"| F1
    E3 -->|"Lookup/Store"| F1
```

**Where:** Static ConcurrentDictionary shared across all AuthService instances

**Why Flyweight:**
- AuthService is Scoped (new instance per request)
- Token storage must persist across requests
- Static dictionary = single shared instance
- Reduces memory usage vs. per-instance storage

---

### 4. Command Pattern (Token Operations)

```mermaid
flowchart TB
    subgraph COMMAND["Command Pattern"]
        direction TB

        subgraph COMMANDS["Token Operations"]
            direction LR
            C1["Validate<br/>─────────────<br/>TryGetValue()"]
            C2["Invalidate<br/>─────────────<br/>TryRemove()"]
            C3["Create<br/>─────────────<br/>GenerateRefreshToken()"]
        end

        subgraph RECEIVER["ConcurrentDictionary"]
            R1["Token Storage"]
        end
    end

    C1 --> R1
    C2 --> R1
    C3 --> R1
```

**Where:** Token CRUD operations on dictionary

**Why Command-like:**
- Each operation encapsulates an action on storage
- Operations can be composed (validate → invalidate → create)
- Clear separation of concerns

---

### 5. Null Object Pattern (Token Lookup)

```mermaid
flowchart TB
    subgraph NULL_OBJECT["Null Object Pattern"]
        direction TB

        subgraph LOOKUP["TryGetValue Result"]
            L1["Token: 'a1b2c3...'"]
            Result{{"Found?"}}
            Found["TokenData<br/>(UserId, Expiry)"]
            NotFound["default<br/>(0, default DateTime)"]
        end

        subgraph ACTION["Action"]
            A1["Continue validation"]
            A2["Throw exception"]
        end
    end

    L1 --> Result
    Result -->|"true"| Found --> A1
    Result -->|"false"| NotFound --> A2
```

**Where:** TryGetValue returns false + default value instead of throwing

**Why:**
- Avoids exception for expected "not found" case
- Boolean return indicates success/failure
- Cleaner control flow

---

### 6. Data Transfer Object (DTO) Pattern

```mermaid
flowchart LR
    subgraph REQUEST["Request DTO"]
        Req["RefreshTokenRequestDto<br/>─────────────<br/>RefreshToken: string"]
    end

    subgraph INTERNAL["Internal Data"]
        Int["(UserId, Expiry) tuple<br/>User entity"]
    end

    subgraph RESPONSE["Response DTO"]
        Res["LoginResponseDto<br/>─────────────<br/>Token<br/>RefreshToken<br/>UserId<br/>Username<br/>Email<br/>Role"]
    end

    REQUEST --> INTERNAL --> RESPONSE
```

**Where:** RefreshTokenRequestDto and LoginResponseDto

**Why DTO:**
- Clear API contract
- Hide internal tuple structure
- Consistent response format across all auth endpoints

---

### 7. Facade Pattern (RefreshTokenAsync)

```mermaid
flowchart TB
    subgraph CLIENT["Client"]
        Controller["AuthController"]
    end

    subgraph FACADE["Facade: RefreshTokenAsync()"]
        Auth["AuthService<br/>─────────────<br/>Simple API:<br/>RefreshTokenAsync(token)"]
    end

    subgraph SUBSYSTEM["Subsystem"]
        direction TB
        Dict["ConcurrentDictionary"]
        UOW["UnitOfWork"]
        Repo["UserRepository"]
        JWT["JwtService"]
    end

    Controller -->|"RefreshTokenAsync(token)"| Auth
    Auth -->|"TryGetValue"| Dict
    Auth -->|"GetByIdAsync"| UOW
    UOW --> Repo
    Auth -->|"GenerateToken"| JWT
```

**Where:** RefreshTokenAsync hides complexity of token validation + rotation

**Why Facade:**
- Controller just calls one method
- All complexity hidden: validate, lookup user, rotate, generate
- Easy to use, easy to test

---

## SOLID Principles Applied

### S - Single Responsibility Principle (SRP)

```mermaid
flowchart TB
    subgraph SRP["Single Responsibility"]
        direction LR

        subgraph DTO["RefreshTokenRequestDto"]
            D1["Carry refresh token only"]
        end

        subgraph STORAGE["ConcurrentDictionary"]
            S1["Store tokens only"]
        end

        subgraph HELPER["GenerateRefreshToken"]
            H1["Create + store token"]
        end

        subgraph SERVICE["RefreshTokenAsync"]
            SV1["Orchestrate refresh flow"]
        end
    end
```

| Component | Single Responsibility |
|-----------|----------------------|
| RefreshTokenRequestDto | Carry refresh token in request |
| ConcurrentDictionary | Thread-safe token storage |
| GenerateRefreshToken | Create and store new refresh token |
| RefreshTokenAsync | Orchestrate token refresh flow |
| JwtService | Generate JWT access tokens |

---

### O - Open/Closed Principle (OCP)

```mermaid
flowchart TB
    subgraph OCP["Open/Closed"]
        direction TB

        subgraph CLOSED["Closed for Modification"]
            Existing["Existing auth methods<br/>─────────────<br/>RegisterAsync<br/>LoginAsync<br/>GoogleAuthAsync"]
        end

        subgraph OPEN["Open for Extension"]
            Helper["GenerateRefreshToken()<br/>─────────────<br/>Added to all methods<br/>without changing their logic"]
            New["RefreshTokenAsync()<br/>─────────────<br/>New method added<br/>without changing existing"]
        end
    end

    Existing -.->|"Extended with"| Helper
    Existing -.->|"Not modified for"| New
```

**Where Applied:**
- Added refresh token to existing methods by calling helper
- Added RefreshTokenAsync without changing other methods
- LoginResponseDto extended with new field (additive change)

---

### L - Liskov Substitution Principle (LSP)

```mermaid
flowchart TB
    subgraph LSP["Liskov Substitution"]
        Result["LoginResponseDto<br/>─────────────<br/>token<br/>refreshToken<br/>userId<br/>..."]

        subgraph METHODS["All Auth Methods Return Same Type"]
            M1["RegisterAsync()"]
            M2["LoginAsync()"]
            M3["GoogleAuthAsync()"]
            M4["RefreshTokenAsync()"]
        end
    end

    M1 --> Result
    M2 --> Result
    M3 --> Result
    M4 --> Result
```

**Where Applied:**
- All auth methods return LoginResponseDto
- Frontend can handle any auth response the same way
- RefreshTokenAsync follows same contract as other methods

---

### I - Interface Segregation Principle (ISP)

```mermaid
flowchart TB
    subgraph ISP["Interface Segregation"]
        direction TB

        subgraph AUTH["IAuthService"]
            A1["RegisterAsync()"]
            A2["LoginAsync()"]
            A3["GoogleAuthAsync()"]
            A4["GetCurrentUserAsync()"]
            A5["RefreshTokenAsync() ← NEW"]
        end

        subgraph SEPARATE["Separated Concerns"]
            S1["IJwtService<br/>GenerateToken()"]
            S2["IUnitOfWork<br/>Users.GetByIdAsync()"]
        end
    end
```

**Where Applied:**
- IAuthService contains only auth-related methods
- Token storage is implementation detail (not in interface)
- JWT generation delegated to IJwtService

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
            Dict["ConcurrentDictionary"]
            UoW["UnitOfWork"]
            JWT["JwtService"]
        end
    end

    Controller -->|"depends on"| IAuth
    Service -.->|"implements"| IAuth
    Service -->|"uses"| Dict
    Service -->|"uses"| UoW
    Service -->|"uses"| JWT
```

**Where Applied:**
- Controller depends on IAuthService interface
- Controller doesn't know about ConcurrentDictionary
- DI Container injects AuthService at runtime

---

## Summary Table

| Pattern/Principle | Where Applied | Benefit |
|-------------------|---------------|---------|
| **Strategy** | Access vs Refresh token generation | Different algorithms, same goal |
| **Template Method** | Auth flow structure | Shared steps, varying authentication |
| **Flyweight** | Static ConcurrentDictionary | Single shared storage instance |
| **Command** | Token operations | Composable actions |
| **Null Object** | TryGetValue | No exception for "not found" |
| **DTO** | Request/Response | Clear API contract |
| **Facade** | RefreshTokenAsync | Hide complexity |
| **SRP** | Separate concerns | Each component has one job |
| **OCP** | New functionality | No existing code broken |
| **LSP** | Consistent return type | Substitutable methods |
| **ISP** | Focused interface | Auth methods only |
| **DIP** | Interface dependency | Loose coupling |

---

## Related Documentation

- [00-development-plan.md](./00-development-plan.md) - Implementation details
- [01-architecture-diagram.md](./01-architecture-diagram.md) - System architecture
- [03-programming-concepts.md](./03-programming-concepts.md) - Programming concepts
