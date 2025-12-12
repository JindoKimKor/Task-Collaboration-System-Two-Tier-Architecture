# Design Patterns & SOLID Principles in Repository Pattern

## GoF Design Patterns Applied

### 1. Template Method Pattern (Repository‹T›)

```mermaid
flowchart TB
    subgraph PATTERN["Template Method Pattern"]
        direction TB
        AbstractClass["Repository‹T› (Abstract)<br/>─────────────<br/>Defines the skeleton of CRUD operations<br/>Concrete methods use _dbSet"]
        ConcreteClass["UserRepository (Concrete)<br/>─────────────<br/>Inherits all CRUD methods<br/>Adds User-specific methods"]
    end

    AbstractClass -->|inherited by| ConcreteClass
```

**Where:** `Repository<T>` → `UserRepository`

**Why Template Method:**
- `Repository<T>` defines the **skeleton** of CRUD operations
- Subclasses (`UserRepository`) **inherit** these operations without rewriting
- Subclasses can **extend** with additional methods (`FindByEmailAsync`)

```csharp
// Template (Abstract Base)
public abstract class Repository<T> : IRepository<T> where T : class
{
    protected readonly DbSet<T> _dbSet;  // Shared resource

    // Template methods - same for all entities
    public async Task<T?> GetByIdAsync(int id) => await _dbSet.FindAsync(id);
    public async Task<IEnumerable<T>> GetAllAsync() => await _dbSet.ToListAsync();
}

// Concrete Implementation
public class UserRepository : Repository<User>, IUserRepository
{
    // Inherits all CRUD from Repository<User>
    // Adds User-specific methods
    public async Task<User?> FindByEmailAsync(string email) => ...
}
```

---

### 2. Facade Pattern (UnitOfWork)

```mermaid
flowchart TB
    subgraph CLIENT["Client"]
        AuthService["AuthService"]
    end

    subgraph FACADE["Facade: UnitOfWork"]
        UnitOfWork["UnitOfWork<br/>─────────────<br/>Provides simplified interface<br/>to complex subsystem"]
    end

    subgraph SUBSYSTEM["Complex Subsystem"]
        direction LR
        DbContext["ApplicationDbContext"]
        Transaction["IDbContextTransaction"]
        Repository["IUserRepository"]
    end

    AuthService -->|"simple API"| UnitOfWork
    UnitOfWork -->|"manages"| DbContext
    UnitOfWork -->|"manages"| Transaction
    UnitOfWork -->|"exposes"| Repository
```

**Where:** `UnitOfWork` wraps `ApplicationDbContext`, `IDbContextTransaction`, `IUserRepository`

**Why Facade:**
- Client (`AuthService`) only knows about `IUnitOfWork`
- Hides complexity of `DbContext`, transactions, multiple repositories
- Single entry point for all data operations

```csharp
// Without Facade - Client must manage everything
var context = new ApplicationDbContext();
var userRepo = new UserRepository(context);
var transaction = await context.Database.BeginTransactionAsync();
// ... complex coordination

// With Facade - Simple API
await _unitOfWork.Users.AddAsync(user);
await _unitOfWork.SaveChangesAsync();
```

---

### 3. Strategy Pattern (IRepository‹T›)

```mermaid
flowchart TB
    subgraph CONTEXT["Context: UnitOfWork"]
        UOW["UnitOfWork<br/>─────────────<br/>IUserRepository Users { get; }"]
    end

    subgraph STRATEGY["Strategy Interface"]
        IRepo["IRepository‹T›<br/>─────────────<br/>Defines common algorithm interface"]
    end

    subgraph CONCRETE["Concrete Strategies"]
        direction LR
        UserRepo["UserRepository<br/>(User entity)"]
        TaskRepo["TaskRepository<br/>(TaskItem entity)"]
        FutureRepo["FutureRepository<br/>(Any new entity)"]
    end

    UOW -->|"uses"| STRATEGY
    UserRepo -.->|implements| IRepo
    TaskRepo -.->|implements| IRepo
    FutureRepo -.->|implements| IRepo
```

**Where:** `IRepository<T>` with different entity implementations

**Why Strategy:**
- Same interface (`IRepository<T>`) for different entities
- Can swap implementations without changing client code
- Easy to add new entity repositories

---

## SOLID Principles Applied

### S - Single Responsibility Principle (SRP)

```mermaid
flowchart LR
    subgraph BEFORE["Without SRP (Bad)"]
        BadService["AuthService<br/>─────────────<br/>- Database queries<br/>- Transaction management<br/>- Business logic<br/>- Password hashing"]
    end

    subgraph AFTER["With SRP (Good)"]
        direction TB
        GoodService["AuthService<br/>─────────────<br/>Business logic only"]
        Repo["UserRepository<br/>─────────────<br/>Database queries only"]
        UOW["UnitOfWork<br/>─────────────<br/>Transaction management only"]
    end
```

**Where Applied:**
| Class | Single Responsibility |
|-------|----------------------|
| `Repository<T>` | Generic CRUD operations only |
| `UserRepository` | User-specific queries only |
| `UnitOfWork` | Transaction coordination only |
| `AuthService` | Authentication business logic only |

---

### O - Open/Closed Principle (OCP)

```mermaid
flowchart TB
    subgraph OCP["Open for Extension, Closed for Modification"]
        direction TB
        Base["Repository‹T› (Closed)<br/>─────────────<br/>Core CRUD - don't modify"]

        subgraph EXTENSIONS["Extensions (Open)"]
            direction LR
            User["UserRepository<br/>+FindByEmailAsync()"]
            Task["TaskRepository<br/>+FindByAssigneeAsync()"]
            Future["NewRepository<br/>+CustomMethod()"]
        end
    end

    Base -->|extend without modifying| EXTENSIONS
```

**Where Applied:**
- `Repository<T>` is **closed** - we don't modify its CRUD methods
- `UserRepository` is **open** - we extend with new methods
- Adding `TaskRepository` doesn't require changing existing code

```csharp
// Adding new repository - NO modification to Repository<T>
public class TaskRepository : Repository<TaskItem>, ITaskRepository
{
    public async Task<IEnumerable<TaskItem>> FindByAssigneeAsync(int userId) => ...
}
```

---

### L - Liskov Substitution Principle (LSP)

```mermaid
flowchart LR
    subgraph LSP["Liskov Substitution"]
        Interface["IUserRepository"]

        subgraph SUBSTITUTABLE["Can substitute any implementation"]
            Real["UserRepository"]
            Mock["MockUserRepository"]
            Test["TestUserRepository"]
        end
    end

    Interface -->|"any of these work"| SUBSTITUTABLE
```

**Where Applied:**
- Anywhere `IUserRepository` is expected, `UserRepository` works correctly
- Anywhere `IRepository<User>` is expected, `UserRepository` works correctly
- Can substitute with mock implementations for testing

```csharp
// Both work correctly - LSP satisfied
IUserRepository repo1 = new UserRepository(context);
IRepository<User> repo2 = new UserRepository(context);

// For testing - substitute with mock
IUserRepository mockRepo = new MockUserRepository();
```

---

### I - Interface Segregation Principle (ISP)

```mermaid
flowchart TB
    subgraph BAD["Without ISP (Bad)"]
        FatInterface["IRepository<br/>─────────────<br/>GetByIdAsync()<br/>GetAllAsync()<br/>FindAsync()<br/>AddAsync()<br/>DeleteAsync()<br/>EditAsync()<br/>FindByEmailAsync()<br/>FindByUsernameAsync()<br/>ExistsAsync()<br/>...all methods"]
    end

    subgraph GOOD["With ISP (Good)"]
        direction TB
        IRepo["IRepository‹T›<br/>─────────────<br/>Generic CRUD only"]
        IUser["IUserRepository<br/>─────────────<br/>User-specific only"]

        IUser -->|extends| IRepo
    end
```

**Where Applied:**
- `IRepository<T>` - only generic CRUD methods (6 methods)
- `IUserRepository` - only User-specific methods (4 methods)
- Clients depend only on interfaces they actually use

```csharp
// ISP - Separate interfaces for different concerns
public interface IRepository<T>  // Generic CRUD
{
    Task<T?> GetByIdAsync(int id);
    Task AddAsync(T entity);
    // ... only generic methods
}

public interface IUserRepository : IRepository<User>  // User-specific
{
    Task<User?> FindByEmailAsync(string email);
    Task<bool> ExistsAsync(string email, string username);
    // ... only User methods
}
```

---

### D - Dependency Inversion Principle (DIP)

```mermaid
flowchart TB
    subgraph DIP["Dependency Inversion"]
        direction TB

        subgraph HIGHLEVEL["High-Level Module"]
            AuthService["AuthService"]
        end

        subgraph ABSTRACTIONS["Abstractions (Interfaces)"]
            IUnitOfWork["IUnitOfWork"]
            IUserRepository["IUserRepository"]
        end

        subgraph LOWLEVEL["Low-Level Modules"]
            UnitOfWork["UnitOfWork"]
            UserRepository["UserRepository"]
            DbContext["ApplicationDbContext"]
        end
    end

    AuthService -->|depends on| IUnitOfWork
    IUnitOfWork -->|depends on| IUserRepository
    UnitOfWork -.->|implements| IUnitOfWork
    UserRepository -.->|implements| IUserRepository
    UnitOfWork -->|uses| DbContext
```

**Where Applied:**
- `AuthService` depends on `IUnitOfWork` (abstraction), not `UnitOfWork` (concrete)
- `UnitOfWork` depends on `IUserRepository` (abstraction), not `UserRepository` (concrete)
- High-level modules don't depend on low-level modules

```csharp
// DIP - Depend on abstractions
public class AuthService
{
    private readonly IUnitOfWork _unitOfWork;  // Interface, not concrete class

    public AuthService(IUnitOfWork unitOfWork)  // Injected via DI
    {
        _unitOfWork = unitOfWork;
    }
}

// Program.cs - DI wires up concrete implementations
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
```

---

## Summary Table

| Pattern/Principle | Where Applied | Benefit |
|-------------------|---------------|---------|
| **Template Method** | Repository‹T› → UserRepository | Code reuse, consistent CRUD |
| **Facade** | UnitOfWork | Simplified API, hide complexity |
| **Strategy** | IRepository‹T› implementations | Swappable, extensible |
| **SRP** | Each class has one job | Maintainable, testable |
| **OCP** | Repository‹T› base class | Extend without modify |
| **LSP** | Interface implementations | Substitutable, mockable |
| **ISP** | IRepository‹T› + IUserRepository | Focused interfaces |
| **DIP** | Constructor injection | Loose coupling, testable |
