# Programming Concepts

## Entity Framework Core Concepts

### 1. Navigation Properties

```mermaid
flowchart LR
    subgraph USER["User Entity"]
        U["User<br/>───────────<br/>Id: 1<br/>Name: 'John'<br/>───────────<br/>CreatedTasks: [...]<br/>AssignedTasks: [...]"]
    end

    subgraph TASK["TaskItem Entity"]
        T["TaskItem<br/>───────────<br/>Id: 5<br/>CreatedById: 1 (FK)<br/>AssignedToId: 1 (FK)<br/>───────────<br/>CreatedBy: User<br/>AssignedTo: User"]
    end

    U <-->|"Navigation Properties"| T
```

**Definition:**
- Properties that reference related entities
- Enable traversing relationships in code
- Two types: Reference (single) and Collection (many)

**Code:**
```csharp
// In TaskItem entity
public int CreatedById { get; set; }              // Foreign Key
public User CreatedBy { get; set; } = null!;      // Navigation Property

public int? AssignedToId { get; set; }            // Nullable FK
public User? AssignedTo { get; set; }             // Nullable Navigation
```

```csharp
// In User entity
public ICollection<TaskItem> CreatedTasks { get; set; }  // Collection Navigation
public ICollection<TaskItem> AssignedTasks { get; set; } // Collection Navigation
```

---

### 2. Eager Loading with Include()

```mermaid
flowchart TB
    subgraph WITHOUT["Without Include (N+1 Problem)"]
        Q1["Query 1: SELECT * FROM Tasks"]
        Q2["Query 2: SELECT * FROM Users WHERE Id = 1"]
        Q3["Query 3: SELECT * FROM Users WHERE Id = 2"]
        QN["Query N: ..."]

        Q1 --> Q2 --> Q3 --> QN
    end

    subgraph WITH["With Include (Single Query)"]
        Single["SELECT t.*, u1.*, u2.*<br/>FROM Tasks t<br/>LEFT JOIN Users u1 ON t.CreatedById = u1.Id<br/>LEFT JOIN Users u2 ON t.AssignedToId = u2.Id"]
    end
```

**Code:**
```csharp
// Eager loading - single query with JOINs
var tasks = await _context.Tasks
    .Include(t => t.CreatedBy)
    .Include(t => t.AssignedTo)
    .ToListAsync();
```

**When to use:**
- When you know you'll need related data
- To avoid N+1 query problem
- For API responses that include related entities

---

### 3. Fluent API Configuration

```mermaid
flowchart TB
    subgraph FLUENT["Fluent API in OnModelCreating"]
        direction TB
        Entity["modelBuilder.Entity‹TaskItem›(entity => { ... })"]

        Key["entity.HasKey(t => t.Id)"]
        Prop["entity.Property(t => t.Title)<br/>  .IsRequired()<br/>  .HasMaxLength(200)"]
        Rel["entity.HasOne(t => t.CreatedBy)<br/>  .WithMany(u => u.CreatedTasks)<br/>  .HasForeignKey(t => t.CreatedById)<br/>  .OnDelete(DeleteBehavior.Restrict)"]
    end
```

**Why Fluent API vs Data Annotations?**
- More control over configuration
- Keep entity classes clean (POCO)
- Configure relationships clearly
- Required for complex scenarios

**Delete Behaviors:**
| Behavior | Description |
|----------|-------------|
| `Cascade` | Delete related entities |
| `Restrict` | Prevent delete if related exists |
| `SetNull` | Set FK to null on delete |
| `NoAction` | Do nothing (may fail at DB) |

---

### 4. DbSet and DbContext

```mermaid
flowchart TB
    subgraph DBCONTEXT["ApplicationDbContext : DbContext"]
        direction TB
        DbSetUsers["DbSet‹User› Users"]
        DbSetTasks["DbSet‹TaskItem› Tasks"]
        OnModel["OnModelCreating()<br/>───────────<br/>Fluent API configuration"]
    end

    subgraph OPERATIONS["Operations"]
        Add["_context.Tasks.Add(task)"]
        Query["_context.Tasks.Where(...)"]
        Update["_context.Tasks.Update(task)"]
        Remove["_context.Tasks.Remove(task)"]
        Save["_context.SaveChanges()"]
    end

    DBCONTEXT -->|"provides"| OPERATIONS
```

---

## C# Language Features

### 1. Tuple Return Types

```mermaid
flowchart LR
    subgraph METHOD["Method"]
        Sig["Task‹(IEnumerable‹TaskItem› Items, int TotalCount)›<br/>GetPagedAsync(...)"]
    end

    subgraph RETURN["Return Statement"]
        Ret["return (items, totalCount);"]
    end

    subgraph USAGE["Deconstruction"]
        Dec["var (items, count) = await GetPagedAsync(...);"]
    end

    METHOD --> RETURN --> USAGE
```

**Why Tuples?**
- Return multiple values without creating a class
- Named elements for clarity
- Deconstructed at call site

---

### 2. Nullable Reference Types

```mermaid
flowchart TB
    subgraph NULLABLE["Nullable Reference Types (C# 8+)"]
        direction LR

        NonNull["User CreatedBy<br/>───────────<br/>Cannot be null<br/>Compiler warning if null"]

        Nullable["User? AssignedTo<br/>───────────<br/>Can be null<br/>Must check before use"]
    end

    subgraph CODE["Usage"]
        Check["if (task.AssignedTo != null)<br/>{<br/>  var name = task.AssignedTo.Name;<br/>}"]
    end
```

**In our code:**
```csharp
public int? AssignedToId { get; set; }        // Nullable value type
public User? AssignedTo { get; set; }          // Nullable reference type

// Safe access
AssignedTo = task.AssignedTo != null
    ? MapToUserSummary(task.AssignedTo)
    : null
```

---

### 3. LINQ Query Methods

```mermaid
flowchart LR
    subgraph QUERY["IQueryable Pipeline"]
        direction LR
        Start["_context.Tasks"]
        Where[".Where(t => ...)"]
        Include[".Include(t => ...)"]
        OrderBy[".OrderByDescending(t => t.UpdatedAt)"]
        Skip[".Skip(10)"]
        Take[".Take(10)"]
        ToList[".ToListAsync()"]
    end

    Start --> Where --> Include --> OrderBy --> Skip --> Take --> ToList
```

**Key LINQ Methods:**
| Method | Purpose |
|--------|---------|
| `Where()` | Filter records |
| `Include()` | Eager load relations |
| `OrderBy()` / `OrderByDescending()` | Sort results |
| `Skip()` | Skip N records |
| `Take()` | Take N records |
| `Select()` | Project/transform |
| `FirstOrDefaultAsync()` | Get single or null |
| `ToListAsync()` | Execute and materialize |
| `CountAsync()` | Count records |

---

### 4. Async/Await Pattern

```mermaid
sequenceDiagram
    participant C as Controller
    participant S as Service
    participant R as Repository
    participant DB as Database

    C->>S: await CreateTaskAsync(...)

    Note over C: Thread released<br/>back to pool

    S->>R: await AddAsync(...)
    R->>DB: INSERT (async I/O)

    Note over R: Thread released<br/>during I/O

    DB-->>R: Complete
    R-->>S: Complete

    S->>R: await SaveChangesAsync()
    R->>DB: COMMIT (async I/O)
    DB-->>R: Complete

    R-->>S: Complete
    S-->>C: TaskResponseDto
```

**Key Points:**
- `async` marks method as asynchronous
- `await` pauses execution until task completes
- Thread is released during I/O operations
- Better scalability for web applications

---

### 5. Expression-bodied Members

```csharp
// Traditional method
public async Task<TaskResponseDto?> GetTaskByIdAsync(int id)
{
    var task = await _unitOfWork.Tasks.GetByIdWithDetailsAsync(id);
    return task != null ? MapToResponseDto(task) : null;
}

// Can use expression body for simple methods
private UserSummaryDto MapToUserSummary(User user) => new UserSummaryDto
{
    Id = user.Id,
    Name = user.Name,
    Email = user.Email
};
```

---

## ASP.NET Core Concepts

### 1. Model Binding

```mermaid
flowchart LR
    subgraph REQUEST["HTTP Request"]
        Body["JSON Body:<br/>{<br/>  'title': 'New Task',<br/>  'description': '...'<br/>}"]
        Route["Route: /api/tasks/5"]
        Query["Query: ?page=1&pageSize=10"]
    end

    subgraph BINDING["Model Binding"]
        FromBody["[FromBody]<br/>───────────<br/>JSON → DTO"]
        FromRoute["[FromRoute]<br/>───────────<br/>URL segment → parameter"]
        FromQuery["[FromQuery]<br/>───────────<br/>Query string → parameter"]
    end

    subgraph PARAMS["Method Parameters"]
        DTO["CreateTaskRequestDto request"]
        Id["int id"]
        Page["int page"]
    end

    Body --> FromBody --> DTO
    Route --> FromRoute --> Id
    Query --> FromQuery --> Page
```

---

### 2. Model Validation with [ApiController]

```mermaid
flowchart TB
    subgraph REQUEST["Request Body"]
        JSON["{ 'title': '' }"]
    end

    subgraph DTO["CreateTaskRequestDto"]
        Attr["[Required]<br/>[MaxLength(200)]<br/>public string Title { get; set; }"]
    end

    subgraph APICONTROLLER["[ApiController] Behavior"]
        Check["Automatic validation"]
        Invalid{{"ModelState.IsValid?"}}
        Auto400["Return 400 BadRequest<br/>ValidationProblemDetails"]
        Continue["Continue to action"]
    end

    REQUEST --> DTO --> Check
    Check --> Invalid
    Invalid -->|No| Auto400
    Invalid -->|Yes| Continue
```

---

### 3. Action Results

```mermaid
flowchart TB
    subgraph RESULTS["IActionResult Types"]
        Ok["Ok(data)<br/>───────────<br/>200 OK + body"]
        Created["CreatedAtAction(...)<br/>───────────<br/>201 Created + Location"]
        NoContent["NoContent()<br/>───────────<br/>204 No Content"]
        BadRequest["BadRequest(data)<br/>───────────<br/>400 Bad Request"]
        NotFound["NotFound()<br/>───────────<br/>404 Not Found"]
        Forbid["Forbid()<br/>───────────<br/>403 Forbidden"]
    end
```

**Usage:**
```csharp
return Ok(result);                           // 200
return CreatedAtAction(nameof(GetTask), new { id }, result);  // 201
return NoContent();                          // 204
return BadRequest(error);                    // 400
return NotFound();                           // 404
return Forbid();                             // 403
```

---

### 4. Claims-Based Identity

```mermaid
flowchart TB
    subgraph JWT["JWT Token"]
        Payload["Payload:<br/>───────────<br/>sub: '3'<br/>email: 'john@example.com'<br/>role: 'Admin'"]
    end

    subgraph CLAIMS["ClaimsPrincipal"]
        User["User.Claims<br/>───────────<br/>NameIdentifier: '3'<br/>Email: 'john@example.com'<br/>Role: 'Admin'"]
    end

    subgraph ACCESS["Accessing Claims"]
        Code["User.FindFirst(ClaimTypes.NameIdentifier)<br/>User.FindFirst(ClaimTypes.Role)<br/>User.IsInRole('Admin')"]
    end

    JWT -->|"Middleware extracts"| CLAIMS
    CLAIMS -->|"Available in Controller"| ACCESS
```

---

### 5. Dependency Injection Lifetimes

```mermaid
flowchart TB
    subgraph LIFETIMES["Service Lifetimes"]
        Transient["AddTransient‹T›()<br/>───────────<br/>New instance every time"]
        Scoped["AddScoped‹T›()<br/>───────────<br/>Same instance per HTTP request"]
        Singleton["AddSingleton‹T›()<br/>───────────<br/>Same instance for app lifetime"]
    end

    subgraph USAGE["Our Usage"]
        DbCtx["AddDbContext ➜ Scoped<br/>(per request)"]
        Repos["AddScoped‹IRepository›<br/>(per request)"]
        Services["AddScoped‹IService›<br/>(per request)"]
    end

    Scoped --> USAGE
```

**Why Scoped for DbContext?**
- Unit of Work pattern: one transaction per request
- Prevents connection leaks
- Ensures consistent state within request

---

## Database Concepts

### 1. Foreign Keys

```mermaid
erDiagram
    USER ||--o{ TASKITEM : "creates"
    USER ||--o{ TASKITEM : "assigned"

    USER {
        int Id PK
        string Name
    }

    TASKITEM {
        int Id PK
        string Title
        int CreatedById FK "NOT NULL"
        int AssignedToId FK "NULLABLE"
    }
```

**FK Constraints:**
- `CreatedById`: Required (every task has a creator)
- `AssignedToId`: Optional (task may not be assigned)

---

### 2. Pagination with OFFSET-FETCH

```sql
-- Skip first 10, take next 10
SELECT *
FROM Tasks
ORDER BY UpdatedAt DESC
OFFSET 10 ROWS
FETCH NEXT 10 ROWS ONLY;
```

**C# equivalent:**
```csharp
.Skip((page - 1) * pageSize)
.Take(pageSize)
```

---

### 3. Indexes

```csharp
// In ApplicationDbContext
entity.HasIndex(u => u.Email).IsUnique();
entity.HasIndex(u => u.Username).IsUnique();
```

**Why indexes?**
- Speed up lookups by indexed column
- Unique indexes enforce uniqueness
- Important for frequently queried columns

---

## HTTP Concepts

### 1. RESTful Resource Naming

```
GET    /api/tasks          → List all tasks
GET    /api/tasks/5        → Get task with ID 5
POST   /api/tasks          → Create new task
PUT    /api/tasks/5        → Update task 5
DELETE /api/tasks/5        → Delete task 5
```

**Conventions:**
- Nouns for resources (`tasks`, not `getTasks`)
- Plural names (`tasks`, not `task`)
- HTTP verbs for actions
- ID in URL path, not query string

---

### 2. HTTP Status Code Categories

| Range | Category | Examples |
|-------|----------|----------|
| 2xx | Success | 200 OK, 201 Created, 204 No Content |
| 4xx | Client Error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found |
| 5xx | Server Error | 500 Internal Server Error |

---

### 3. Content Negotiation

```mermaid
flowchart LR
    subgraph REQUEST["Request Headers"]
        Accept["Accept: application/json"]
        ContentType["Content-Type: application/json"]
    end

    subgraph ASPNET["ASP.NET Core"]
        Serialize["JSON Serialization<br/>───────────<br/>System.Text.Json"]
    end

    subgraph RESPONSE["Response"]
        JSON["Content-Type: application/json<br/>───────────<br/>{ 'id': 5, 'title': '...' }"]
    end

    REQUEST --> ASPNET --> RESPONSE
```

**[ApiController] automatically:**
- Deserializes JSON request body
- Serializes response to JSON
- Sets Content-Type header
