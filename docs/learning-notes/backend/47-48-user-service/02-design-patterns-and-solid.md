# Design Patterns & SOLID Principles

## Design Patterns Used

### 1. Service Layer Pattern

```mermaid
flowchart TB
    subgraph PATTERN["Service Layer Pattern"]
        direction TB
        Controller["UsersController<br/>───────────<br/>HTTP concerns only"]
        Interface["IUserService<br/>───────────<br/>«interface»"]
        Service["UserService<br/>───────────<br/>Business logic"]
        Data["IUnitOfWork<br/>───────────<br/>Data access"]

        Controller -->|"depends on"| Interface
        Service -->|implements| Interface
        Service -->|"uses"| Data
    end

    subgraph BENEFIT["Benefits"]
        B1["Separation of concerns"]
        B2["Testable business logic"]
        B3["Reusable across controllers"]
    end
```

**Implementation:**
```csharp
// Interface (contract)
public interface IUserService
{
    Task<IEnumerable<UserListItemDto>> GetAllUsersAsync();
    Task<UserResponseDto?> GetUserByIdAsync(int id);
}

// Implementation (business logic)
public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;

    public async Task<IEnumerable<UserListItemDto>> GetAllUsersAsync()
    {
        var users = await _unitOfWork.Users.GetAllAsync();
        return users.Select(u => new UserListItemDto { ... });
    }
}
```

---

### 2. DTO Pattern (Data Transfer Object)

```mermaid
flowchart LR
    subgraph ENTITY["Entity (Internal)"]
        User["User<br/>───────────<br/>Id, Name, Email<br/>PasswordHash<br/>RefreshToken<br/>Role, CreatedAt"]
    end

    subgraph DTO["DTOs (External)"]
        ListItem["UserListItemDto<br/>───────────<br/>Id, Name, Initials<br/>(no sensitive data)"]

        Response["UserResponseDto<br/>───────────<br/>Id, Name, Email<br/>Initials, CreatedAt<br/>(no sensitive data)"]
    end

    User -->|"filter & map"| ListItem
    User -->|"filter & map"| Response
```

**Why DTOs for User?**
- **Security**: Never expose `PasswordHash`, `RefreshToken`
- **API Contract**: Stable interface regardless of entity changes
- **Flexibility**: Different shapes for different use cases

---

### 3. Thin Controller Pattern

```mermaid
flowchart LR
    subgraph THIN["Thin Controller (10-15 lines)"]
        Controller["UsersController<br/>───────────<br/>1. Receive request<br/>2. Call service<br/>3. Return response"]
    end

    subgraph SERVICE["Service Layer"]
        UserService["UserService<br/>───────────<br/>Business logic<br/>Entity → DTO mapping<br/>Data access coordination"]
    end

    Controller -->|"delegates all logic"| SERVICE
```

**UsersController Example:**
```csharp
[HttpGet]
public async Task<IActionResult> GetUsers()
{
    var users = await _userService.GetAllUsersAsync();  // Delegate
    return Ok(users);                                    // Return
}
```

---

### 4. Dependency Injection Pattern

```mermaid
flowchart TB
    subgraph REGISTRATION["Program.cs Registration"]
        R1["builder.Services.AddScoped‹IUserService, UserService›()"]
    end

    subgraph CONTAINER["DI Container"]
        C1[(IUserService → UserService)]
    end

    subgraph INJECTION["Constructor Injection"]
        Controller["UsersController(IUserService userService)"]
        Service["UserService(IUnitOfWork unitOfWork)"]
    end

    REGISTRATION --> CONTAINER
    CONTAINER -->|"injects"| INJECTION
```

**Scoped Lifetime:**
- One instance per HTTP request
- Matches DbContext lifetime
- Fresh state for each request

---

### 5. Reuse of Existing Infrastructure

```mermaid
flowchart TB
    subgraph EXISTING["Already Implemented (Phase 1)"]
        direction TB
        IUserRepo["IUserRepository<br/>───────────<br/>FindByEmailAsync()<br/>ExistsAsync()"]
        IRepo["IRepository‹User›<br/>───────────<br/>GetAllAsync()<br/>GetByIdAsync()"]
        UserRepo["UserRepository"]
        UoW["UnitOfWork.Users"]
    end

    subgraph NEW["New in Phase 3"]
        direction TB
        IUserService["IUserService"]
        UserService["UserService"]
        UsersController["UsersController"]
    end

    IUserRepo -->|extends| IRepo
    UserRepo -->|implements| IUserRepo
    UoW -->|exposes| IUserRepo

    UserService -->|"reuses"| UoW
    UsersController -->|uses| IUserService

    style EXISTING fill:#e8f5e9
    style NEW fill:#e3f2fd
```

**No new repository code needed!**
- `GetAllAsync()` - inherited from `IRepository<T>`
- `GetByIdAsync()` - inherited from `IRepository<T>`

---

## SOLID Principles Applied

### S - Single Responsibility Principle

```mermaid
flowchart TB
    subgraph SRP["Single Responsibility"]
        direction LR

        Controller["UsersController<br/>───────────<br/>Responsibility:<br/>HTTP handling"]

        Service["UserService<br/>───────────<br/>Responsibility:<br/>User retrieval logic"]

        DTO["UserListItemDto<br/>───────────<br/>Responsibility:<br/>API data shape"]
    end
```

**Each class has ONE job:**
- `UsersController`: Handle HTTP requests/responses
- `UserService`: Coordinate user retrieval and mapping
- `UserListItemDto`: Define API response shape

---

### O - Open/Closed Principle

```mermaid
flowchart TB
    subgraph OCP["Open/Closed Principle"]
        direction TB

        IUserService["IUserService<br/>───────────<br/>Open for extension"]

        UserService["UserService<br/>───────────<br/>Current implementation"]

        CachedService["CachedUserService<br/>───────────<br/>Future: with caching"]
    end

    UserService -->|implements| IUserService
    CachedService -->|implements| IUserService
```

**Future extensibility:**
- Add caching without modifying `UserService`
- Add filtering without changing interface
- Swap implementations via DI

---

### L - Liskov Substitution Principle

```mermaid
flowchart TB
    subgraph LSP["Liskov Substitution"]
        Interface["IUserService"]

        Impl1["UserService<br/>(Production)"]
        Impl2["MockUserService<br/>(Testing)"]

        Controller["UsersController<br/>───────────<br/>Works with any<br/>IUserService"]
    end

    Impl1 -->|implements| Interface
    Impl2 -->|implements| Interface
    Controller -->|"uses"| Interface
```

**Any implementation works:**
- Production: `UserService`
- Testing: `MockUserService`
- Controller doesn't know the difference

---

### I - Interface Segregation Principle

```mermaid
flowchart TB
    subgraph ISP["Interface Segregation"]
        direction TB

        IUserService["IUserService<br/>───────────<br/>GetAllUsersAsync()<br/>GetUserByIdAsync()"]

        IAuthService["IAuthService<br/>───────────<br/>RegisterAsync()<br/>LoginAsync()<br/>RefreshTokenAsync()"]
    end

    Note["Separate interfaces<br/>for different concerns"]
```

**Small, focused interfaces:**
- `IUserService`: User retrieval (read-only)
- `IAuthService`: Authentication (write operations)
- Clients depend only on what they need

---

### D - Dependency Inversion Principle

```mermaid
flowchart TB
    subgraph HIGH["High-Level Module"]
        Controller["UsersController"]
    end

    subgraph ABSTRACTION["Abstractions"]
        IUserService["IUserService"]
    end

    subgraph LOW["Low-Level Module"]
        UserService["UserService"]
    end

    Controller -->|"depends on"| ABSTRACTION
    UserService -->|"implements"| ABSTRACTION
```

**Key Points:**
- Controller depends on `IUserService` (abstraction)
- Not on `UserService` (implementation)
- Easy to change implementation without touching controller

---

## Pattern Summary

```mermaid
flowchart TB
    subgraph REQUEST["HTTP Request: GET /api/users"]
        Client["Client with JWT"]
    end

    subgraph PATTERNS["Patterns Working Together"]
        direction TB

        DI["Dependency Injection<br/>───────────<br/>Wire dependencies"]

        Thin["Thin Controller<br/>───────────<br/>HTTP only"]

        Service["Service Layer<br/>───────────<br/>Business logic"]

        DTO["DTO Pattern<br/>───────────<br/>Shape output"]

        Reuse["Reuse Pattern<br/>───────────<br/>Existing Repository"]
    end

    Client --> Thin
    DI -.->|"provides"| Thin
    Thin -->|"calls"| Service
    Service -->|"uses"| Reuse
    Service -->|"returns"| DTO
    DTO --> Client
```
