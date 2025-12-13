# Programming Concepts

## C# Language Features

### 1. Interface Implementation

```mermaid
flowchart TB
    subgraph INTERFACE["Interface Definition"]
        IUserService["public interface IUserService<br/>───────────<br/>Task‹IEnumerable‹UserListItemDto›› GetAllUsersAsync();<br/>Task‹UserResponseDto?› GetUserByIdAsync(int id);"]
    end

    subgraph IMPLEMENTATION["Implementation"]
        UserService["public class UserService : IUserService<br/>───────────<br/>public async Task‹IEnumerable‹UserListItemDto›› GetAllUsersAsync()<br/>{<br/>    // implementation<br/>}"]
    end

    UserService -->|implements| INTERFACE
```

**Key Points:**
- Interface defines the contract (what)
- Class provides the implementation (how)
- `: IUserService` indicates implementation

---

### 2. LINQ Select (Projection)

```mermaid
flowchart LR
    subgraph INPUT["Input Collection"]
        Users["IEnumerable‹User›<br/>───────────<br/>User { Id=1, Name='John', Email='...', PasswordHash='...' }<br/>User { Id=2, Name='Jane', Email='...', PasswordHash='...' }"]
    end

    subgraph SELECT["Select Transform"]
        Lambda[".Select(u => new UserListItemDto<br/>{<br/>    Id = u.Id,<br/>    Name = u.Name,<br/>    Initials = GetInitials(u.Name)<br/>})"]
    end

    subgraph OUTPUT["Output Collection"]
        DTOs["IEnumerable‹UserListItemDto›<br/>───────────<br/>{ Id=1, Name='John', Initials='J' }<br/>{ Id=2, Name='Jane', Initials='J' }"]
    end

    Users --> SELECT --> DTOs
```

**Code:**
```csharp
var users = await _unitOfWork.Users.GetAllAsync();

return users.Select(u => new UserListItemDto
{
    Id = u.Id,
    Name = u.Name,
    Initials = GetInitials(u.Name)
});
```

**Why Select?**
- Transform each element
- Project to different type
- Filter out unwanted properties

---

### 3. Nullable Reference Types

```mermaid
flowchart TB
    subgraph NULLABLE["Nullable Types"]
        direction LR

        NonNull["UserResponseDto<br/>───────────<br/>Cannot be null"]

        Nullable["UserResponseDto?<br/>───────────<br/>Can be null"]
    end

    subgraph USAGE["Usage in GetUserByIdAsync"]
        Check["var user = await _unitOfWork.Users.GetByIdAsync(id);<br/><br/>if (user == null)<br/>    return null;<br/><br/>return new UserResponseDto { ... };"]
    end
```

**Method Signature:**
```csharp
public async Task<UserResponseDto?> GetUserByIdAsync(int id)
//                              ^ nullable return type
```

**Why nullable return?**
- User might not exist
- Caller must handle null case
- Compiler enforces null checks

---

### 4. GetInitials Helper Method

```mermaid
flowchart TB
    subgraph INPUT["Input Examples"]
        I1["'John Doe'"]
        I2["'Alice'"]
        I3["'Mary Jane Watson'"]
        I4["''"]
    end

    subgraph LOGIC["GetInitials Logic"]
        Split["Split by space"]
        Check{{"parts.Length?"}}
        Zero["0 → '?'"]
        One["1 → first char upper"]
        Many["2+ → first + last char upper"]
    end

    subgraph OUTPUT["Output"]
        O1["'JD'"]
        O2["'A'"]
        O3["'MW'"]
        O4["'?'"]
    end

    I1 --> Split --> Check
    Check -->|0| Zero --> O4
    Check -->|1| One --> O2
    Check -->|2+| Many --> O1
    I3 --> Split
    Many --> O3
```

**Code:**
```csharp
private static string GetInitials(string name)
{
    var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);

    if (parts.Length == 0) return "?";
    if (parts.Length == 1) return parts[0][0].ToString().ToUpper();

    return $"{parts[0][0]}{parts[^1][0]}".ToUpper();
}
```

**Explanation:**
- `Split(' ', StringSplitOptions.RemoveEmptyEntries)`: Split and remove empty entries
- `parts[0][0]`: First character of first word
- `parts[^1][0]`: First character of last word (`^1` = index from end)
- `.ToUpper()`: Convert to uppercase

---

### 5. String Interpolation

```csharp
// String interpolation with $
return $"{parts[0][0]}{parts[^1][0]}".ToUpper();

// Equivalent to:
return (parts[0][0].ToString() + parts[^1][0].ToString()).ToUpper();
```

**Benefits:**
- More readable
- Type-safe
- Compile-time checked

---

## ASP.NET Core Concepts

### 1. Controller Attributes

```mermaid
flowchart TB
    subgraph ATTRIBUTES["Controller Attributes"]
        Route["[Route('api/[controller]')]<br/>───────────<br/>URL: /api/users<br/>(plural from class name)"]

        ApiController["[ApiController]<br/>───────────<br/>Auto model validation<br/>Auto 400 on invalid"]

        Authorize["[Authorize]<br/>───────────<br/>Requires JWT token<br/>401 if missing/invalid"]
    end
```

**Combined Effect:**
```csharp
[Route("api/[controller]")]  // /api/users
[ApiController]               // Auto-validation
[Authorize]                   // Require JWT
public class UsersController : ControllerBase
```

---

### 2. ProducesResponseType Attribute

```mermaid
flowchart TB
    subgraph SWAGGER["Swagger/OpenAPI Documentation"]
        Get200["[ProducesResponseType(typeof(IEnumerable‹UserListItemDto›), 200)]<br/>───────────<br/>Success: returns user array"]

        Get401["[ProducesResponseType(401)]<br/>───────────<br/>Unauthorized: no token"]

        GetId404["[ProducesResponseType(typeof(ErrorResponseDto), 404)]<br/>───────────<br/>Not Found: user doesn't exist"]
    end
```

**Purpose:**
- Documents API responses
- Generates Swagger UI
- Helps API consumers

---

### 3. IActionResult Return Types

```mermaid
flowchart TB
    subgraph RESULTS["Action Results"]
        Ok["Ok(data)<br/>───────────<br/>200 OK + JSON body"]

        NotFound["NotFound(error)<br/>───────────<br/>404 Not Found + error body"]

        Unauthorized["Implicit 401<br/>───────────<br/>[Authorize] handles this"]
    end
```

**Usage Pattern:**
```csharp
[HttpGet("{id}")]
public async Task<IActionResult> GetUser(int id)
{
    var user = await _userService.GetUserByIdAsync(id);

    if (user == null)
    {
        return NotFound(new ErrorResponseDto
        {
            Error = "Not found",
            Message = "User not found"
        });
    }

    return Ok(user);
}
```

---

### 4. Constructor Injection

```mermaid
flowchart TB
    subgraph DI["Dependency Injection Flow"]
        Container["DI Container<br/>───────────<br/>IUserService → UserService"]

        Constructor["public UsersController(IUserService userService)<br/>{<br/>    _userService = userService;<br/>}"]

        Field["private readonly IUserService _userService;"]
    end

    Container -->|"injects"| Constructor
    Constructor -->|"assigns"| Field
```

**Best Practices:**
- `readonly` field prevents reassignment
- Private field with underscore prefix
- Interface type (not concrete)

---

## Comparison: TaskService vs UserService

```mermaid
flowchart TB
    subgraph TASK["TaskService (Complex)"]
        direction TB
        T1["7 methods"]
        T2["CRUD operations"]
        T3["Authorization logic"]
        T4["Multiple DTOs"]
        T5["Pagination"]
    end

    subgraph USER["UserService (Simple)"]
        direction TB
        U1["2 methods"]
        U2["Read-only operations"]
        U3["No authorization needed"]
        U4["2 DTOs"]
        U5["No pagination"]
    end

    subgraph COMMON["Common Patterns"]
        C1["IUnitOfWork injection"]
        C2["Interface + Implementation"]
        C3["GetInitials() helper"]
        C4["Entity → DTO mapping"]
    end

    TASK -.->|"same patterns"| COMMON
    USER -.->|"same patterns"| COMMON
```

**UserService is intentionally simple:**
- Read-only (no create/update/delete)
- All authenticated users can access
- No complex business rules
- Reuses existing repository

---

## Error Handling Pattern

```mermaid
flowchart TB
    subgraph REQUEST["GET /api/users/999"]
        Client["Client"]
    end

    subgraph CONTROLLER["UsersController"]
        Call["var user = await _userService.GetUserByIdAsync(999);"]
        Check{{"user == null?"}}
        Return404["return NotFound(ErrorResponseDto)"]
        Return200["return Ok(user)"]
    end

    Client --> Call
    Call --> Check
    Check -->|Yes| Return404
    Check -->|No| Return200
```

**Consistent Error Response:**
```csharp
return NotFound(new ErrorResponseDto
{
    Error = "Not found",
    Message = "User not found"
});
```

**Same pattern as TasksController** for consistency.

---

## HTTP Status Codes Summary

| Endpoint | Success | Errors |
|----------|---------|--------|
| `GET /api/users` | 200 + array | 401 (no token) |
| `GET /api/users/{id}` | 200 + object | 401, 404 |

**Why no 403?**
- All authenticated users can view user list
- No role-based restrictions on this endpoint
- Used for task assignment dropdown (everyone needs it)
