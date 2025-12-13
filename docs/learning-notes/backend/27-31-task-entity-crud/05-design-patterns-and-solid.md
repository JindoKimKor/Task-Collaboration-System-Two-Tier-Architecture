# Design Patterns & SOLID Principles

## Design Patterns Used

### 1. Repository Pattern

```mermaid
flowchart TB
    subgraph PATTERN["Repository Pattern"]
        direction TB
        Service["TaskService<br/>───────────<br/>Business Logic"]
        Interface["ITaskRepository<br/>───────────<br/>«interface»"]
        Repo["TaskRepository<br/>───────────<br/>EF Core Implementation"]
        DB[(Database)]

        Service -->|"depends on"| Interface
        Repo -->|implements| Interface
        Repo -->|"uses"| DB
    end

    subgraph BENEFIT["Benefits"]
        B1["Abstraction from data access"]
        B2["Testable (mock interface)"]
        B3["Centralized queries"]
    end
```

**Implementation:**
```csharp
// Interface (contract)
public interface ITaskRepository : IRepository<TaskItem>
{
    Task<(IEnumerable<TaskItem> Items, int TotalCount)> GetPagedAsync(...);
}

// Implementation (hidden from service)
public class TaskRepository : Repository<TaskItem>, ITaskRepository
{
    public async Task<(IEnumerable<TaskItem>, int)> GetPagedAsync(...)
    {
        // EF Core specific code here
    }
}
```

---

### 2. Unit of Work Pattern

```mermaid
flowchart TB
    subgraph UOW["Unit of Work Pattern"]
        direction TB
        UnitOfWork["UnitOfWork<br/>───────────<br/>-_context<br/>+Users: IUserRepository<br/>+Tasks: ITaskRepository<br/>+SaveChangesAsync()"]

        UserRepo["UserRepository"]
        TaskRepo["TaskRepository"]
        DbContext["ApplicationDbContext"]

        UnitOfWork -->|"exposes"| UserRepo
        UnitOfWork -->|"exposes"| TaskRepo
        UnitOfWork -->|"manages"| DbContext
    end

    subgraph PURPOSE["Purpose"]
        P1["Single transaction boundary"]
        P2["Coordinate multiple repositories"]
        P3["Consistent SaveChanges()"]
    end
```

**Implementation:**
```csharp
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    public IUserRepository Users { get; }
    public ITaskRepository Tasks { get; }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
}
```

---

### 3. DTO Pattern (Data Transfer Object)

```mermaid
flowchart LR
    subgraph CLIENT["Client"]
        Request["HTTP Request<br/>───────────<br/>JSON body"]
    end

    subgraph DTOS["DTOs"]
        RequestDto["CreateTaskRequestDto<br/>───────────<br/>Shape for input"]
        ResponseDto["TaskResponseDto<br/>───────────<br/>Shape for output"]
    end

    subgraph ENTITY["Entity"]
        TaskItem["TaskItem<br/>───────────<br/>Database model"]
    end

    Request -->|"deserialize"| RequestDto
    RequestDto -->|"map"| TaskItem
    TaskItem -->|"map"| ResponseDto
    ResponseDto -->|"serialize"| CLIENT
```

**Why DTOs?**
- Don't expose entity structure to API
- Different shapes for different operations
- Validation attributes on request DTOs
- Prevent over-posting attacks

---

### 4. Dependency Injection Pattern

```mermaid
flowchart TB
    subgraph REGISTRATION["Program.cs Registration"]
        R1["builder.Services.AddScoped‹ITaskRepository, TaskRepository›()"]
        R2["builder.Services.AddScoped‹ITaskService, TaskService›()"]
    end

    subgraph CONTAINER["DI Container"]
        C1[(ITaskRepository → TaskRepository)]
        C2[(ITaskService → TaskService)]
    end

    subgraph INJECTION["Constructor Injection"]
        Controller["TasksController(ITaskService taskService)"]
        Service["TaskService(IUnitOfWork unitOfWork)"]
    end

    REGISTRATION --> CONTAINER
    CONTAINER -->|"injects"| INJECTION
```

**Benefits:**
- Loose coupling
- Easy to swap implementations
- Enables unit testing with mocks

---

### 5. Thin Controller Pattern

```mermaid
flowchart LR
    subgraph THIN["Thin Controller"]
        Controller["TasksController<br/>───────────<br/>10-15 lines per method<br/>HTTP concerns only"]
    end

    subgraph SERVICE["Service Layer"]
        TaskService["TaskService<br/>───────────<br/>Business logic<br/>Authorization<br/>Mapping"]
    end

    Controller -->|"delegates"| SERVICE
```

**Controller responsibility:**
- Extract request data
- Call service
- Map exceptions to HTTP status codes
- Return response

**NOT controller responsibility:**
- Business logic
- Authorization rules
- Database access
- Complex validation

---

## SOLID Principles Applied

### S - Single Responsibility Principle

```mermaid
flowchart TB
    subgraph SRP["Single Responsibility"]
        direction LR

        Controller["TasksController<br/>───────────<br/>Responsibility:<br/>HTTP handling"]

        Service["TaskService<br/>───────────<br/>Responsibility:<br/>Business logic"]

        Repository["TaskRepository<br/>───────────<br/>Responsibility:<br/>Data access"]
    end

    Controller -->|"one job"| Service
    Service -->|"one job"| Repository
```

**Examples:**
- `TasksController`: Only handles HTTP requests/responses
- `TaskService`: Only contains business logic and authorization
- `TaskRepository`: Only handles database queries

---

### O - Open/Closed Principle

```mermaid
flowchart TB
    subgraph OCP["Open/Closed Principle"]
        direction TB

        IRepository["IRepository‹T›<br/>───────────<br/>Open for extension"]

        Repository["Repository‹T›<br/>───────────<br/>Base implementation"]

        TaskRepository["TaskRepository<br/>───────────<br/>Extended with custom methods"]
    end

    Repository -->|implements| IRepository
    TaskRepository -->|extends| Repository
```

**How it applies:**
- `Repository<T>` is closed for modification
- `TaskRepository` extends without changing base class
- Add new repository types without modifying existing code

---

### L - Liskov Substitution Principle

```mermaid
flowchart TB
    subgraph LSP["Liskov Substitution"]
        Interface["ITaskRepository"]

        Impl1["TaskRepository<br/>(EF Core)"]
        Impl2["MockTaskRepository<br/>(In-memory for tests)"]

        Service["TaskService<br/>───────────<br/>Works with any<br/>ITaskRepository"]
    end

    Impl1 -->|implements| Interface
    Impl2 -->|implements| Interface
    Service -->|"uses"| Interface
```

**Principle:**
- Any implementation of `ITaskRepository` can substitute another
- `TaskService` doesn't know or care which implementation is used
- Essential for unit testing with mocks

---

### I - Interface Segregation Principle

```mermaid
flowchart TB
    subgraph ISP["Interface Segregation"]
        direction TB

        IRepo["IRepository‹T›<br/>───────────<br/>Generic CRUD operations"]

        ITaskRepo["ITaskRepository<br/>───────────<br/>Task-specific operations<br/>+GetPagedAsync()<br/>+GetByCreatorAsync()"]
    end

    ITaskRepo -->|extends| IRepo
```

**How it applies:**
- `IRepository<T>`: Basic CRUD (small, focused)
- `ITaskRepository`: Task-specific methods (extends, doesn't bloat base)
- Clients depend only on interfaces they need

---

### D - Dependency Inversion Principle

```mermaid
flowchart TB
    subgraph HIGH["High-Level Module"]
        Service["TaskService"]
    end

    subgraph ABSTRACTION["Abstractions"]
        IUnitOfWork["IUnitOfWork"]
        ITaskRepository["ITaskRepository"]
    end

    subgraph LOW["Low-Level Modules"]
        UnitOfWork["UnitOfWork"]
        TaskRepository["TaskRepository"]
        DbContext["ApplicationDbContext"]
    end

    Service -->|"depends on"| ABSTRACTION
    LOW -->|"implements"| ABSTRACTION
```

**Key Points:**
- High-level modules (`TaskService`) depend on abstractions (`IUnitOfWork`)
- Low-level modules (`TaskRepository`) implement abstractions
- Both depend on abstractions, not on each other

---

## Pattern Interactions

```mermaid
flowchart TB
    subgraph REQUEST["HTTP Request"]
        Client["POST /api/tasks"]
    end

    subgraph PATTERNS["Patterns Working Together"]
        direction TB

        DI["Dependency Injection<br/>───────────<br/>Wire up dependencies"]

        Thin["Thin Controller<br/>───────────<br/>HTTP concerns only"]

        DTO["DTO Pattern<br/>───────────<br/>Shape data"]

        Service["Service Pattern<br/>───────────<br/>Business logic"]

        UoW["Unit of Work<br/>───────────<br/>Transaction boundary"]

        Repo["Repository Pattern<br/>───────────<br/>Data access"]
    end

    Client --> Thin
    DI -.->|"provides"| Thin
    Thin -->|"receives"| DTO
    Thin -->|"calls"| Service
    Service -->|"uses"| UoW
    UoW -->|"coordinates"| Repo
```

---

## Anti-Patterns Avoided

```mermaid
flowchart LR
    subgraph AVOID["❌ Anti-Patterns"]
        Fat["Fat Controller<br/>───────────<br/>Business logic in controller"]
        Direct["Direct DbContext<br/>───────────<br/>Controller → DbContext"]
        Expose["Exposed Entities<br/>───────────<br/>Return entities as JSON"]
    end

    subgraph USE["✅ Correct Patterns"]
        ThinC["Thin Controller"]
        RepoP["Repository Pattern"]
        DTOP["DTO Pattern"]
    end

    Fat -->|"replace with"| ThinC
    Direct -->|"replace with"| RepoP
    Expose -->|"replace with"| DTOP
```
