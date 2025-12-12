# Design Patterns & SOLID Principles in Auth Controller

## GoF Design Patterns Applied

### 1. Facade Pattern (AuthController)

```mermaid
flowchart TB
    subgraph CLIENT["Client"]
        Browser["Browser / Swagger / Postman"]
    end

    subgraph FACADE["Facade: AuthController"]
        Controller["AuthController<br/>─────────────<br/>POST /api/auth/register<br/>─────────────<br/>Simple HTTP interface<br/>for complex auth system"]
    end

    subgraph SUBSYSTEM["Complex Subsystem (Hidden)"]
        direction LR
        Auth["IAuthService"]
        Jwt["IJwtService"]
        Repo["IUserRepository"]
        BCrypt["BCrypt"]
        DB["Database"]
    end

    Browser -->|"simple HTTP POST"| Controller
    Controller -->|"delegates"| Auth
    Auth -->|uses| Jwt
    Auth -->|uses| Repo
    Auth -->|uses| BCrypt
    Repo -->|uses| DB
```

**Where:** `AuthController` exposes simple HTTP endpoint to complex auth system

**Why Facade:**
- Client only knows HTTP endpoint (`POST /api/auth/register`)
- Hides entire authentication subsystem (Service, Repository, JWT, BCrypt)
- Single entry point for registration

```csharp
// Without Facade - Client must orchestrate everything
var userRepo = new UserRepository(context);
if (await userRepo.ExistsAsync(email, username)) throw ...;
var hash = BCrypt.HashPassword(password);
var user = new User { ... };
await userRepo.AddAsync(user);
var token = jwtService.GenerateToken(user);
return new LoginResponseDto { ... };

// With Facade - Simple HTTP call
POST /api/auth/register
{ "name": "...", "email": "...", "username": "...", "password": "..." }
```

---

### 2. Thin Controller Pattern (Presentation Layer Pattern)

```mermaid
flowchart TB
    subgraph THIN["Thin Controller Pattern"]
        direction TB

        subgraph CONTROLLER["Controller (Thin)"]
            AC["AuthController<br/>─────────────<br/>• Receive HTTP request<br/>• Validate model (auto)<br/>• Call service<br/>• Return HTTP response<br/>• Handle exceptions"]
        end

        subgraph SERVICE["Service (Fat)"]
            AS["AuthService<br/>─────────────<br/>• Check duplicates<br/>• Hash password<br/>• Determine role<br/>• Create user<br/>• Save to DB<br/>• Generate token"]
        end

        CONTROLLER -->|"delegates ALL logic"| SERVICE
    end
```

**Where:** `AuthController` delegates all business logic to `AuthService`

**Why Thin Controller:**
- Controller only handles HTTP concerns (request/response)
- Business logic lives in Service layer
- Testable: Service can be unit tested without HTTP
- Maintainable: Changes to business logic don't affect Controller

```csharp
// Thin Controller - Only HTTP concerns
[HttpPost("register")]
public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
{
    try
    {
        var result = await _authService.RegisterAsync(request);  // Delegate
        return CreatedAtAction(nameof(Register), result);        // HTTP response
    }
    catch (InvalidOperationException ex)
    {
        return BadRequest(new ErrorResponseDto { ... });         // Error response
    }
}
```

---

### 3. Strategy Pattern (Error Handling)

```mermaid
flowchart TB
    subgraph CONTEXT["Context: AuthController"]
        Controller["AuthController<br/>─────────────<br/>Chooses response strategy<br/>based on result"]
    end

    subgraph STRATEGIES["Response Strategies"]
        direction LR
        Success["201 Created<br/>───────────<br/>LoginResponseDto"]
        ValidationError["400 Bad Request<br/>───────────<br/>ValidationProblemDetails<br/>(automatic)"]
        BusinessError["400 Bad Request<br/>───────────<br/>ErrorResponseDto<br/>(DUPLICATE_USER)"]
    end

    Controller -->|"success"| Success
    Controller -->|"validation fail"| ValidationError
    Controller -->|"business fail"| BusinessError
```

**Where:** Controller returns different response types based on outcome

**Why Strategy:**
- Same endpoint, different response formats
- Each error type has its own response structure
- Easily extensible for new error types

---

### 4. Decorator Pattern (Data Annotations)

```mermaid
flowchart TB
    subgraph BASE["Base Property"]
        Prop["public string Email { get; set; }"]
    end

    subgraph DECORATORS["Decorators (Attributes)"]
        direction TB
        D1["[Required]<br/>───────────<br/>Adds: null check"]
        D2["[EmailAddress]<br/>───────────<br/>Adds: format validation"]
        D3["[MaxLength(255)]<br/>───────────<br/>Adds: length check"]
    end

    subgraph DECORATED["Decorated Property"]
        Final["[Required]<br/>[EmailAddress]<br/>[MaxLength(255)]<br/>public string Email { get; set; }<br/>───────────<br/>Has all validations"]
    end

    BASE -->|"add"| D1
    D1 -->|"add"| D2
    D2 -->|"add"| D3
    D3 -->|"result"| Final
```

**Where:** `RegisterRequestDto` properties with Data Annotations

**Why Decorator:**
- Add validation behavior without modifying property itself
- Stack multiple validations on same property
- Each annotation adds specific validation "layer"

```csharp
// Decorators stacked on property
[Required(ErrorMessage = "Email is required")]           // Decorator 1
[EmailAddress(ErrorMessage = "Invalid email format")]    // Decorator 2
public string Email { get; set; } = string.Empty;
```

---

## SOLID Principles Applied

### S - Single Responsibility Principle (SRP)

```mermaid
flowchart TB
    subgraph SRP["Single Responsibility"]
        direction TB

        subgraph CONTROLLER_RESP["AuthController"]
            C1["HTTP Request/Response handling"]
        end

        subgraph SERVICE_RESP["AuthService"]
            S1["Business logic"]
        end

        subgraph DTO_RESP["DTOs"]
            direction LR
            D1["RegisterRequestDto<br/>───────────<br/>Input data + validation"]
            D2["LoginResponseDto<br/>───────────<br/>Output data"]
            D3["ErrorResponseDto<br/>───────────<br/>Error format"]
        end
    end
```

**Where Applied:**
| Class | Single Responsibility |
|-------|----------------------|
| `AuthController` | HTTP concerns only (receive request, return response) |
| `RegisterRequestDto` | Registration input data and validation rules |
| `LoginResponseDto` | Login response data structure |
| `ErrorResponseDto` | Error response format |
| `AuthService` | Authentication business logic |

---

### O - Open/Closed Principle (OCP)

```mermaid
flowchart TB
    subgraph OCP["Open/Closed Principle"]
        direction TB

        subgraph CLOSED["Closed for Modification"]
            Controller["AuthController<br/>───────────<br/>Existing Register endpoint<br/>Don't modify"]
        end

        subgraph OPEN["Open for Extension"]
            direction LR
            Login["[HttpPost - login]<br/>LoginAsync()"]
            Google["[HttpPost - google]<br/>GoogleAuthAsync()"]
            Refresh["[HttpPost - refresh]<br/>RefreshTokenAsync()"]
        end
    end

    Controller -->|"add new endpoints"| OPEN
```

**Where Applied:**
- Adding new endpoints (Login, Google OAuth) doesn't modify existing Register
- Adding new validation attributes doesn't modify DTO structure
- Adding new error types doesn't modify existing error handling

---

### L - Liskov Substitution Principle (LSP)

```mermaid
flowchart LR
    subgraph LSP["Liskov Substitution"]
        Interface["IAuthService"]

        subgraph SUBSTITUTABLE["Can substitute any implementation"]
            Real["AuthService"]
            Mock["MockAuthService"]
            Test["TestAuthService"]
        end
    end

    Interface -->|"any of these work"| SUBSTITUTABLE
```

**Where Applied:**
- `AuthController` depends on `IAuthService`
- Any implementation of `IAuthService` can be substituted
- Mock implementations work for testing

```csharp
// Controller works with any IAuthService implementation
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;  // Interface

    public AuthController(IAuthService authService)  // Any implementation
    {
        _authService = authService;
    }
}
```

---

### I - Interface Segregation Principle (ISP)

```mermaid
flowchart TB
    subgraph ISP["Interface Segregation"]
        direction TB

        subgraph CONTROLLER_NEEDS["Controller Only Needs"]
            IAuth["IAuthService<br/>───────────<br/>RegisterAsync()<br/>LoginAsync()"]
        end

        subgraph HIDDEN["Hidden from Controller"]
            direction LR
            IJwt["IJwtService"]
            IRepo["IUserRepository"]
            IUoW["IUnitOfWork"]
        end
    end

    AuthController["AuthController"] -->|"depends only on"| IAuth
    IAuth -.->|"uses internally"| HIDDEN
```

**Where Applied:**
- `AuthController` only depends on `IAuthService`
- Controller doesn't know about `IJwtService`, `IUserRepository`
- Each layer has focused interfaces

---

### D - Dependency Inversion Principle (DIP)

```mermaid
flowchart TB
    subgraph DIP["Dependency Inversion"]
        direction TB

        subgraph HIGHLEVEL["High-Level Module"]
            AuthController["AuthController"]
        end

        subgraph ABSTRACTION["Abstraction"]
            IAuthService["IAuthService"]
        end

        subgraph LOWLEVEL["Low-Level Module"]
            AuthService["AuthService"]
        end
    end

    AuthController -->|"depends on"| IAuthService
    AuthService -.->|"implements"| IAuthService
```

**Where Applied:**
- `AuthController` depends on `IAuthService` (abstraction)
- Not on `AuthService` (concrete class)
- DI Container wires up implementation

```csharp
// Program.cs - DI wires concrete to interface
builder.Services.AddScoped<IAuthService, AuthService>();

// Controller depends on abstraction
public AuthController(IAuthService authService)  // Interface injected
```

---

## ASP.NET Core Specific Patterns

### [ApiController] Attribute Pattern

```mermaid
flowchart TB
    subgraph APICONTROLLER["[ApiController] Features"]
        direction TB
        AutoValidation["Automatic Model Validation<br/>───────────<br/>Data Annotations checked<br/>before action executes"]
        AutoBinding["Binding Source Inference<br/>───────────<br/>[FromBody] inferred<br/>for complex types"]
        Auto400["Automatic 400 Response<br/>───────────<br/>ValidationProblemDetails<br/>on validation failure"]
    end

    Request["HTTP Request"] --> AutoBinding
    AutoBinding --> AutoValidation
    AutoValidation -->|"invalid"| Auto400
    AutoValidation -->|"valid"| Controller["Controller Action"]
```

**Where:** `[ApiController]` attribute on `AuthController`

**Why:**
- Automatic model validation (no manual `ModelState.IsValid` check)
- Automatic 400 response on validation failure
- Cleaner controller code

---

### Middleware Pipeline Pattern

```mermaid
flowchart LR
    subgraph PIPELINE["Middleware Pipeline"]
        direction LR
        M1["UseHttpsRedirection()"]
        M2["UseCors()"]
        M3["UseAuthorization()"]
        M4["MapControllers()"]
    end

    Request["Request"] --> M1
    M1 --> M2
    M2 --> M3
    M3 --> M4
    M4 --> Controller["AuthController"]
```

**Where:** `Program.cs` middleware configuration

**Why:**
- Order matters: CORS before Authorization
- Each middleware processes request/response
- Chain of Responsibility pattern

---

## Summary Table

| Pattern/Principle | Where Applied | Benefit |
|-------------------|---------------|---------|
| **Facade** | AuthController | Simple HTTP interface to complex auth system |
| **Thin Controller** | AuthController | HTTP concerns only, business logic in Service |
| **Strategy** | Response types | Different responses for different outcomes |
| **Decorator** | Data Annotations | Stack validation behaviors on properties |
| **SRP** | Controller, DTOs | Each class has one responsibility |
| **OCP** | New endpoints | Add without modifying existing |
| **LSP** | IAuthService | Any implementation substitutable |
| **ISP** | Controller dependencies | Only depends on needed interface |
| **DIP** | Constructor injection | Depends on abstraction, not concrete |
| **[ApiController]** | Auto validation | Cleaner controller code |
| **Middleware Pipeline** | Request processing | Chain of Responsibility |
