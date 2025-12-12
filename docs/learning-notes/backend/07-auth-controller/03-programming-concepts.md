# Programming Concepts Recap (Language Agnostic)

## Table of Contents

1. [Abstraction](#1-abstraction)
2. [Encapsulation](#2-encapsulation)
3. [Dependency Injection](#3-dependency-injection)
4. [Delegation Pattern](#4-delegation-pattern)
5. [Attributes / Decorators](#5-attributes--decorators)
6. [Data Annotations (Declarative Validation)](#6-data-annotations-declarative-validation)
7. [HTTP Abstraction](#7-http-abstraction)
8. [Exception Handling](#8-exception-handling)
9. [Middleware Pipeline](#9-middleware-pipeline)
10. [CORS (Cross-Origin Resource Sharing)](#10-cors-cross-origin-resource-sharing)
11. [Model Binding](#11-model-binding)

---

## 1. Abstraction

**Concept:** Hide complex implementation details, expose only what's necessary.

```mermaid
flowchart LR
    subgraph HIDDEN["Hidden (Behind Controller)"]
        direction TB
        Service["AuthService"]
        Jwt["JwtService"]
        Repo["Repository"]
        DB["Database"]
        BCrypt["Password Hashing"]
    end

    subgraph EXPOSED["Exposed (HTTP Endpoint)"]
        direction TB
        Endpoint["POST /api/auth/register<br/>───────────<br/>Input: JSON body<br/>Output: JSON response"]
    end

    Client["Client"] -->|"only sees"| EXPOSED
    EXPOSED -->|"hides"| HIDDEN
```

**Where Applied:**
- `AuthController` hides entire authentication system
- Client only knows HTTP endpoint, not implementation details
- REST API is abstraction over business logic

**Benefit:** Frontend doesn't need to know about JWT, BCrypt, or database.

---

## 2. Encapsulation

**Concept:** Bundle data and methods together. Control access with visibility modifiers.

```mermaid
flowchart TB
    subgraph CONTROLLER["AuthController"]
        direction TB
        subgraph PRIVATE["Private Fields"]
            Auth["-_authService"]
        end
        subgraph PUBLIC["Public Methods"]
            Register["+Register()"]
        end
    end

    subgraph DTO["RegisterRequestDto"]
        direction TB
        subgraph PROPS["Public Properties"]
            Name["+Name"]
            Email["+Email"]
            Username["+Username"]
            Password["+Password"]
        end
        subgraph VALIDATION["Encapsulated Validation"]
            Rules["[Required]<br/>[EmailAddress]<br/>[MinLength]<br/>[MaxLength]"]
        end
    end
```

**Where Applied:**
| Class | Private | Public |
|-------|---------|--------|
| `AuthController` | `_authService` | `Register()` |
| `RegisterRequestDto` | None | Properties with validation |
| `ErrorResponseDto` | None | `Error`, `Message`, `Details` |

**DTO Encapsulation:**
- Properties are public (data transfer)
- Validation rules are encapsulated via attributes
- External code cannot bypass validation

---

## 3. Dependency Injection

**Concept:** Don't create dependencies inside class. Receive them from outside (constructor injection).

```mermaid
flowchart TB
    subgraph REGISTRATION["Program.cs (Registration)"]
        R1["AddControllers()"]
        R2["AddScoped‹IAuthService, AuthService›()"]
    end

    subgraph CONTAINER["DI Container"]
        direction TB
        Creates["Creates AuthController"]
        Resolves["Resolves IAuthService"]
        Injects["Injects into constructor"]
    end

    subgraph CONSTRUCTOR["AuthController Constructor"]
        Params["AuthController(IAuthService authService)"]
    end

    REGISTRATION -->|"registers"| CONTAINER
    CONTAINER -->|"provides"| CONSTRUCTOR
```

**Where Applied:**

```
// AuthController receives dependency via constructor
public AuthController(IAuthService authService)
{
    _authService = authService;  // Store for later use
}
```

**Benefits:**
- Controller doesn't know about `AuthService` concrete class
- Easy to mock `IAuthService` for testing
- Swap implementations without changing controller

---

## 4. Delegation Pattern

**Concept:** Object delegates responsibility to another object instead of doing it itself.

```mermaid
flowchart LR
    subgraph CONTROLLER["AuthController (Thin)"]
        Register["Register()<br/>───────────<br/>• Receive request<br/>• Delegate to service<br/>• Return response"]
    end

    subgraph SERVICE["AuthService (Fat)"]
        Business["RegisterAsync()<br/>───────────<br/>• Validate duplicates<br/>• Hash password<br/>• Create user<br/>• Generate token"]
    end

    Register -->|"delegates ALL business logic"| Business
```

**Where Applied:**
- Controller delegates registration logic to `IAuthService`
- Controller only handles HTTP concerns
- All business logic lives in Service layer

**Why Delegation (Thin Controller):**
```
// Controller does NOT do this:
[HttpPost("register")]
public async Task<IActionResult> Register(RegisterRequestDto request)
{
    // ❌ BAD - Business logic in controller
    if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        return BadRequest("Duplicate");
    var hash = BCrypt.HashPassword(request.Password);
    var user = new User { ... };
    await _context.SaveChangesAsync();
    var token = GenerateJwt(user);
    return Ok(new { token });
}

// Controller DOES this:
[HttpPost("register")]
public async Task<IActionResult> Register(RegisterRequestDto request)
{
    // ✅ GOOD - Delegate to service
    var result = await _authService.RegisterAsync(request);
    return CreatedAtAction(nameof(Register), result);
}
```

---

## 5. Attributes / Decorators

**Concept:** Add metadata or behavior to classes/methods without modifying their code.

```mermaid
flowchart TB
    subgraph ATTRIBUTES["Attributes on Controller"]
        direction TB
        A1["[ApiController]<br/>───────────<br/>Automatic model validation<br/>Binding source inference"]
        A2["[Route('api/[controller]')]<br/>───────────<br/>URL: /api/auth"]
        A3["[HttpPost('register')]<br/>───────────<br/>HTTP method + route"]
        A4["[ProducesResponseType]<br/>───────────<br/>Swagger documentation"]
    end

    subgraph EFFECT["Effect"]
        direction TB
        E1["Auto 400 on validation fail"]
        E2["Route matching"]
        E3["POST only"]
        E4["API documentation"]
    end

    A1 --> E1
    A2 --> E2
    A3 --> E3
    A4 --> E4
```

**Where Applied:**
| Attribute | Target | Effect |
|-----------|--------|--------|
| `[ApiController]` | Class | Auto validation, auto 400 |
| `[Route]` | Class/Method | URL routing |
| `[HttpPost]` | Method | HTTP verb binding |
| `[FromBody]` | Parameter | Request body binding |
| `[ProducesResponseType]` | Method | Swagger docs |

**Benefits:**
- Declarative - say WHAT, not HOW
- Separation of concerns - behavior added without modifying method body
- Reusable - same attributes on multiple controllers

---

## 6. Data Annotations (Declarative Validation)

**Concept:** Declare validation rules as attributes. Framework enforces automatically.

```mermaid
flowchart TB
    subgraph DTO["RegisterRequestDto"]
        direction TB
        Props["Properties with Annotations"]
    end

    subgraph ANNOTATIONS["Data Annotations"]
        direction LR
        A1["[Required]<br/>───────────<br/>Not null/empty"]
        A2["[EmailAddress]<br/>───────────<br/>Email format"]
        A3["[MinLength]<br/>───────────<br/>Minimum chars"]
        A4["[MaxLength]<br/>───────────<br/>Maximum chars"]
    end

    subgraph PIPELINE["ASP.NET Pipeline"]
        direction TB
        Binding["Model Binding<br/>JSON → DTO"]
        Validation["Model Validation<br/>Check annotations"]
        Auto400["Auto 400 Response<br/>if invalid"]
    end

    DTO --> ANNOTATIONS
    ANNOTATIONS -->|"checked by"| PIPELINE
```

**Where Applied:**

```
public class RegisterRequestDto
{
    [Required(ErrorMessage = "Name is required")]
    [MaxLength(100)]
    public string Name { get; set; }

    [Required]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; }

    [Required]
    [MinLength(3)]
    [MaxLength(50)]
    public string Username { get; set; }

    [Required]
    [MinLength(8)]
    public string Password { get; set; }
}
```

**Declarative vs Imperative:**

```
// Imperative (Bad) - Controller does validation
if (string.IsNullOrEmpty(request.Name))
    return BadRequest("Name required");
if (!IsValidEmail(request.Email))
    return BadRequest("Invalid email");
// ... many more checks

// Declarative (Good) - Annotations do validation
[Required]
[EmailAddress]
public string Email { get; set; }
// Framework handles validation automatically
```

---

## 7. HTTP Abstraction

**Concept:** Framework abstracts HTTP details. Developer works with high-level concepts.

```mermaid
flowchart LR
    subgraph RAW["Raw HTTP (Hidden)"]
        direction TB
        Headers["HTTP Headers"]
        Body["Request Body bytes"]
        Status["Status Code"]
        ContentType["Content-Type"]
    end

    subgraph ABSTRACTED["ASP.NET Abstraction (Used)"]
        direction TB
        DTO["RegisterRequestDto object"]
        IActionResult["IActionResult"]
        Created["CreatedAtAction()"]
        BadRequest["BadRequest()"]
    end

    RAW -->|"abstracted to"| ABSTRACTED
```

**Where Applied:**

| Raw HTTP | ASP.NET Abstraction |
|----------|---------------------|
| Request JSON body | `RegisterRequestDto` parameter |
| `201 Created` status | `CreatedAtAction()` |
| `400 Bad Request` status | `BadRequest()` |
| Response JSON | Return DTO object (auto-serialized) |

**Benefits:**
- No manual JSON parsing
- No manual HTTP status codes
- Type-safe request/response

---

## 8. Exception Handling

**Concept:** Catch exceptions and convert to appropriate HTTP responses.

```mermaid
flowchart TB
    subgraph TRY["Try Block"]
        Service["await _authService.RegisterAsync(request)"]
    end

    subgraph CATCH["Catch Block"]
        direction TB
        Check["InvalidOperationException?"]
        Convert["Convert to BadRequest"]
        Response["ErrorResponseDto"]
    end

    subgraph RESULT["HTTP Response"]
        direction LR
        R200["201 Created<br/>LoginResponseDto"]
        R400["400 Bad Request<br/>ErrorResponseDto"]
    end

    TRY -->|"success"| R200
    TRY -->|"throws"| CATCH
    CATCH --> R400
```

**Where Applied:**

```
try
{
    var result = await _authService.RegisterAsync(request);
    return CreatedAtAction(nameof(Register), result);
}
catch (InvalidOperationException ex)  // Duplicate user
{
    return BadRequest(new ErrorResponseDto
    {
        Error = "DUPLICATE_USER",
        Message = ex.Message
    });
}
```

**Exception to HTTP Mapping:**
| Exception | HTTP Status | Response |
|-----------|-------------|----------|
| Success | 201 Created | `LoginResponseDto` |
| `InvalidOperationException` | 400 Bad Request | `ErrorResponseDto` |
| Validation fail (auto) | 400 Bad Request | `ValidationProblemDetails` |

---

## 9. Middleware Pipeline

**Concept:** Request passes through chain of middleware. Each can process or pass to next.

```mermaid
flowchart LR
    subgraph REQUEST["HTTP Request"]
        R["POST /api/auth/register"]
    end

    subgraph PIPELINE["Middleware Pipeline (Order Matters!)"]
        direction LR
        M1["UseHttpsRedirection()<br/>───────────<br/>Redirect HTTP→HTTPS"]
        M2["UseCors()<br/>───────────<br/>Check CORS policy"]
        M3["UseAuthorization()<br/>───────────<br/>Check JWT (future)"]
        M4["MapControllers()<br/>───────────<br/>Route to controller"]
    end

    subgraph CONTROLLER["AuthController"]
        Action["Register()"]
    end

    REQUEST --> M1 --> M2 --> M3 --> M4 --> Action
```

**Where Applied (Program.cs):**

```
app.UseHttpsRedirection();
app.UseCors("AllowFrontend");  // Must be before UseAuthorization
app.UseAuthorization();
app.MapControllers();
```

**Order Matters!**
- CORS must be before Authorization
- Authorization must be before routing
- Wrong order = unexpected behavior

---

## 10. CORS (Cross-Origin Resource Sharing)

**Concept:** Browser security prevents cross-origin requests. Server must explicitly allow origins.

```mermaid
flowchart TB
    subgraph BROWSER["Browser Security"]
        direction TB
        Same["Same Origin: localhost:5173 → localhost:5173<br/>✅ Allowed automatically"]
        Cross["Cross Origin: localhost:5173 → localhost:7158<br/>❌ Blocked by default"]
    end

    subgraph CORS["CORS Solution"]
        direction TB
        Preflight["1. Browser sends OPTIONS preflight"]
        Check["2. Server checks AllowFrontend policy"]
        Headers["3. Server returns CORS headers"]
        Allow["4. Browser allows actual request"]
    end

    subgraph POLICY["AllowFrontend Policy"]
        direction TB
        Origins["WithOrigins()<br/>localhost:3000 ✅<br/>localhost:5173 ✅"]
        Methods["AllowAnyMethod()<br/>GET, POST, etc."]
        Hdrs["AllowAnyHeader()<br/>Content-Type, etc."]
    end

    Cross -->|"needs"| CORS
    CORS -->|"configured by"| POLICY
```

**Where Applied:**

```
// Program.cs - Configure policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")  // Frontend origin
              .AllowAnyMethod()   // GET, POST, PUT, DELETE
              .AllowAnyHeader()   // Content-Type, Authorization
              .AllowCredentials(); // For cookies/SignalR
    });
});

// Program.cs - Apply middleware
app.UseCors("AllowFrontend");
```

**Why Needed:**
- Frontend (React): `http://localhost:5173`
- Backend (API): `https://localhost:7158`
- Different ports = different origins = blocked by browser

---

## 11. Model Binding

**Concept:** Framework automatically converts HTTP request data to method parameters.

```mermaid
flowchart LR
    subgraph HTTP["HTTP Request"]
        direction TB
        Body["Body: {<br/>  'name': 'John',<br/>  'email': 'j@x.com',<br/>  'username': 'john',<br/>  'password': 'pass123'<br/>}"]
        Headers["Content-Type: application/json"]
    end

    subgraph BINDING["Model Binding"]
        direction TB
        Deserialize["JSON Deserializer"]
        Create["Create RegisterRequestDto"]
        Populate["Populate properties"]
    end

    subgraph PARAMETER["Method Parameter"]
        DTO["RegisterRequestDto request<br/>───────────<br/>Name = 'John'<br/>Email = 'j@x.com'<br/>Username = 'john'<br/>Password = 'pass123'"]
    end

    HTTP --> BINDING --> PARAMETER
```

**Where Applied:**

```
[HttpPost("register")]
public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
//                                         ^^^^^^^^^ Model binding source
//                                                   ^^^^^^^^^^^^^^^^^^^^ Bound object
```

**Binding Sources:**
| Attribute | Source | Example |
|-----------|--------|---------|
| `[FromBody]` | Request body | JSON payload |
| `[FromRoute]` | URL path | `/api/users/{id}` |
| `[FromQuery]` | Query string | `?page=1&size=10` |
| `[FromHeader]` | HTTP header | `Authorization: Bearer ...` |

**`[ApiController]` Inference:**
- Complex types → `[FromBody]` (auto)
- Simple types from route → `[FromRoute]` (auto)

---

## Summary Table

| Concept | Where Applied | Key Benefit |
|---------|---------------|-------------|
| **Abstraction** | HTTP endpoint hides system | Simple API |
| **Encapsulation** | Private `_authService` | Controlled access |
| **DI** | Constructor injection | Loose coupling |
| **Delegation** | Controller → Service | Thin controller |
| **Attributes** | `[ApiController]`, `[HttpPost]` | Declarative behavior |
| **Data Annotations** | `[Required]`, `[EmailAddress]` | Auto validation |
| **HTTP Abstraction** | `CreatedAtAction()`, DTOs | High-level API |
| **Exception Handling** | try-catch to HTTP | Graceful errors |
| **Middleware** | Pipeline order | Request processing |
| **CORS** | AllowFrontend policy | Cross-origin access |
| **Model Binding** | `[FromBody]` | Auto deserialization |
