# Design Patterns - GoF (Gang of Four)

## Overview

The Gang of Four (GoF) patterns are 23 classic design patterns documented in "Design Patterns: Elements of Reusable Object-Oriented Software" (1994) by Gamma, Helm, Johnson, and Vlissides.

```mermaid
flowchart TB
    subgraph GOF["GoF Pattern Categories"]
        direction TB
        Creational["Creational Patterns<br/>───────────<br/>Object creation mechanisms"]
        Structural["Structural Patterns<br/>───────────<br/>Object composition"]
        Behavioral["Behavioral Patterns<br/>───────────<br/>Object communication"]
    end
```

---

## Creational Patterns Used

### 1. Factory Method Pattern

```mermaid
flowchart TB
    subgraph PATTERN["Factory Method Pattern"]
        direction TB
        Creator["Creator (Abstract)<br/>───────────<br/>+FactoryMethod(): Product"]
        ConcreteCreator["Concrete Creator<br/>───────────<br/>+FactoryMethod(): ConcreteProduct"]
        Product["Product (Interface)<br/>───────────<br/>«interface»"]
        ConcreteProduct["Concrete Product<br/>───────────<br/>Implementation"]

        Creator -->|defines| Product
        ConcreteCreator -->|extends| Creator
        ConcreteCreator -->|creates| ConcreteProduct
        ConcreteProduct -->|implements| Product
    end
```

**In Our Code (Implicit via DI):**
```csharp
// Program.cs acts as a factory configuration
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ITaskService, TaskService>();

// DI Container is the "Factory" that creates instances
public class TasksController
{
    // Factory Method: DI resolves ITaskService → TaskService
    public TasksController(ITaskService taskService) { }
}
```

**GoF Definition:** Define an interface for creating an object, but let subclasses decide which class to instantiate.

---

### 2. Singleton Pattern

```mermaid
flowchart TB
    subgraph SINGLETON["Singleton Pattern"]
        direction TB
        Class["Singleton Class<br/>───────────<br/>-instance: Singleton<br/>-Singleton() private<br/>+GetInstance(): Singleton"]

        Instance["Single Instance<br/>───────────<br/>Shared across application"]
    end

    Class -->|"returns same"| Instance
```

**In Our Code (via DI):**
```csharp
// AddSingleton - same instance for entire application lifetime
builder.Services.AddSingleton<IConfiguration>(configuration);

// Note: We use AddScoped for most services (one per request)
// but the pattern concept is the same
```

**GoF Definition:** Ensure a class has only one instance and provide a global point of access to it.

---

### 3. Abstract Factory Pattern (Conceptual)

```mermaid
flowchart TB
    subgraph ABSTRACT_FACTORY["Abstract Factory"]
        direction TB
        AbstractFactory["IUnitOfWork<br/>───────────<br/>«interface»<br/>+Users: IUserRepository<br/>+Tasks: ITaskRepository"]

        ConcreteFactory["UnitOfWork<br/>───────────<br/>+Users: UserRepository<br/>+Tasks: TaskRepository"]

        AbstractProduct1["IUserRepository"]
        AbstractProduct2["ITaskRepository"]

        ConcreteProduct1["UserRepository"]
        ConcreteProduct2["TaskRepository"]
    end

    ConcreteFactory -->|implements| AbstractFactory
    AbstractFactory -->|creates| AbstractProduct1
    AbstractFactory -->|creates| AbstractProduct2
    ConcreteFactory -->|provides| ConcreteProduct1
    ConcreteFactory -->|provides| ConcreteProduct2
```

**In Our Code:**
```csharp
public interface IUnitOfWork
{
    IUserRepository Users { get; }  // Abstract Product
    ITaskRepository Tasks { get; }  // Abstract Product
}

public class UnitOfWork : IUnitOfWork
{
    public IUserRepository Users { get; }  // Concrete Product
    public ITaskRepository Tasks { get; }  // Concrete Product
}
```

**GoF Definition:** Provide an interface for creating families of related objects without specifying their concrete classes.

---

## Structural Patterns Used

### 4. Adapter Pattern

```mermaid
flowchart LR
    subgraph ADAPTER["Adapter Pattern"]
        direction LR
        Client["Client<br/>───────────<br/>TaskService"]
        Target["Target Interface<br/>───────────<br/>ITaskRepository"]
        Adapter["Adapter<br/>───────────<br/>TaskRepository"]
        Adaptee["Adaptee<br/>───────────<br/>EF Core DbContext"]
    end

    Client -->|"uses"| Target
    Adapter -->|"implements"| Target
    Adapter -->|"wraps"| Adaptee
```

**In Our Code:**
```csharp
// TaskRepository adapts EF Core DbContext to our ITaskRepository interface
public class TaskRepository : ITaskRepository
{
    private readonly ApplicationDbContext _context;  // Adaptee

    // Adapts DbContext operations to our interface
    public async Task<TaskItem?> GetByIdAsync(int id)
    {
        return await _context.Tasks.FindAsync(id);
    }
}
```

**GoF Definition:** Convert the interface of a class into another interface clients expect.

---

### 5. Facade Pattern

```mermaid
flowchart TB
    subgraph FACADE["Facade Pattern"]
        direction TB
        Client["Client<br/>───────────<br/>TasksController"]

        Facade["Facade<br/>───────────<br/>TaskService"]

        Subsystem1["UnitOfWork"]
        Subsystem2["TaskRepository"]
        Subsystem3["UserRepository"]
        Subsystem4["DTO Mapping"]
    end

    Client -->|"simple interface"| Facade
    Facade -->|"coordinates"| Subsystem1
    Facade -->|"coordinates"| Subsystem2
    Facade -->|"coordinates"| Subsystem3
    Facade -->|"coordinates"| Subsystem4
```

**In Our Code:**
```csharp
// TaskService is a Facade - provides simple interface to complex subsystem
public class TaskService : ITaskService
{
    public async Task<TaskResponseDto> CreateTaskAsync(CreateTaskRequestDto request, int userId)
    {
        // Hides complexity:
        // 1. Entity creation
        // 2. Repository operations
        // 3. SaveChanges coordination
        // 4. Reloading with relations
        // 5. DTO mapping
    }
}

// Controller only sees simple interface
await _taskService.CreateTaskAsync(request, userId);
```

**GoF Definition:** Provide a unified interface to a set of interfaces in a subsystem.

---

### 6. Composite Pattern (Conceptual)

```mermaid
flowchart TB
    subgraph COMPOSITE["Composite Pattern"]
        direction TB
        Component["IRepository‹T›<br/>───────────<br/>«interface»<br/>Common operations"]

        Leaf["Repository‹T›<br/>───────────<br/>Base implementation"]

        Composite["Specialized Repository<br/>───────────<br/>TaskRepository<br/>UserRepository"]
    end

    Leaf -->|implements| Component
    Composite -->|extends| Leaf
    Composite -->|implements additional| ITaskRepository
```

**GoF Definition:** Compose objects into tree structures to represent part-whole hierarchies.

---

## Behavioral Patterns Used

### 7. Strategy Pattern

```mermaid
flowchart TB
    subgraph STRATEGY["Strategy Pattern"]
        direction TB
        Context["Context<br/>───────────<br/>TasksController"]

        Strategy["Strategy Interface<br/>───────────<br/>ITaskService"]

        ConcreteA["Concrete Strategy A<br/>───────────<br/>TaskService<br/>(Production)"]

        ConcreteB["Concrete Strategy B<br/>───────────<br/>MockTaskService<br/>(Testing)"]
    end

    Context -->|"uses"| Strategy
    ConcreteA -->|implements| Strategy
    ConcreteB -->|implements| Strategy
```

**In Our Code:**
```csharp
// Strategy interface
public interface ITaskService
{
    Task<TaskResponseDto> CreateTaskAsync(CreateTaskRequestDto request, int userId);
}

// Context uses strategy via DI - can swap implementations
public class TasksController
{
    private readonly ITaskService _taskService;  // Strategy

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }
}

// Swap strategy in tests
services.AddScoped<ITaskService, MockTaskService>();
```

**GoF Definition:** Define a family of algorithms, encapsulate each one, and make them interchangeable.

---

### 8. Template Method Pattern

```mermaid
flowchart TB
    subgraph TEMPLATE["Template Method Pattern"]
        direction TB
        AbstractClass["Repository‹T›<br/>───────────<br/>+GetByIdAsync() template<br/>+GetAllAsync() template<br/>+AddAsync() template"]

        ConcreteClass["TaskRepository<br/>───────────<br/>+GetPagedAsync() override<br/>+GetByCreatorAsync() new"]
    end

    ConcreteClass -->|extends| AbstractClass
```

**In Our Code:**
```csharp
// Abstract class with template methods
public class Repository<T> : IRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    // Template methods - same for all entities
    public virtual async Task<T?> GetByIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }
}

// Concrete class can override or add methods
public class TaskRepository : Repository<TaskItem>, ITaskRepository
{
    // Uses inherited template methods
    // Adds specialized methods
    public async Task<TaskItem?> GetByIdWithDetailsAsync(int id)
    {
        return await _context.Tasks
            .Include(t => t.CreatedBy)
            .FirstOrDefaultAsync(t => t.Id == id);
    }
}
```

**GoF Definition:** Define the skeleton of an algorithm, deferring some steps to subclasses.

---

### 9. Iterator Pattern (Built-in)

```mermaid
flowchart LR
    subgraph ITERATOR["Iterator Pattern"]
        direction LR
        Collection["Collection<br/>───────────<br/>IEnumerable‹TaskItem›"]

        Iterator["Iterator<br/>───────────<br/>IEnumerator‹TaskItem›"]

        Client["Client<br/>───────────<br/>foreach loop"]
    end

    Collection -->|"GetEnumerator()"| Iterator
    Client -->|"iterates"| Iterator
```

**In Our Code:**
```csharp
// IEnumerable is Iterator pattern in C#
public async Task<(IEnumerable<TaskItem> Items, int TotalCount)> GetPagedAsync(...)
{
    var items = await query.ToListAsync();  // Returns IEnumerable
    return (items, totalCount);
}

// Usage - foreach uses iterator
foreach (var task in items)
{
    yield return MapToResponseDto(task);
}
```

**GoF Definition:** Provide a way to access elements of a collection sequentially without exposing its underlying representation.

---

### 10. Observer Pattern (Future: SignalR)

```mermaid
flowchart TB
    subgraph OBSERVER["Observer Pattern"]
        direction TB
        Subject["Subject<br/>───────────<br/>TaskService<br/>(notifies on changes)"]

        Observer1["Observer 1<br/>───────────<br/>SignalR Client A"]
        Observer2["Observer 2<br/>───────────<br/>SignalR Client B"]
        Observer3["Observer 3<br/>───────────<br/>SignalR Client C"]
    end

    Subject -->|"notify"| Observer1
    Subject -->|"notify"| Observer2
    Subject -->|"notify"| Observer3
```

**Future Implementation (SignalR):**
```csharp
// Subject notifies observers
public async Task<TaskResponseDto> UpdateTaskAsync(...)
{
    // ... update logic ...

    // Notify all observers (connected clients)
    await _hubContext.Clients.All.SendAsync("TaskUpdated", result);

    return result;
}
```

**GoF Definition:** Define a one-to-many dependency so that when one object changes state, all dependents are notified.

---

## Pattern Summary Table

| Pattern | Category | Used In | Purpose |
|---------|----------|---------|---------|
| Factory Method | Creational | DI Container | Object creation |
| Singleton | Creational | Configuration | Single instance |
| Abstract Factory | Creational | IUnitOfWork | Related object families |
| Adapter | Structural | Repository | Interface conversion |
| Facade | Structural | TaskService | Simplified interface |
| Strategy | Behavioral | Service injection | Swappable algorithms |
| Template Method | Behavioral | Repository‹T› | Algorithm skeleton |
| Iterator | Behavioral | IEnumerable | Sequential access |
| Observer | Behavioral | SignalR (future) | Change notification |

---

## GoF Patterns Not Used (and Why)

```mermaid
flowchart TB
    subgraph NOTUSED["Patterns Not Applicable"]
        direction TB
        Bridge["Bridge<br/>───────────<br/>No need to vary<br/>abstraction & implementation"]
        Decorator["Decorator<br/>───────────<br/>Middleware handles<br/>cross-cutting concerns"]
        Flyweight["Flyweight<br/>───────────<br/>No memory optimization<br/>needed for task objects"]
        Proxy["Proxy<br/>───────────<br/>EF Core handles<br/>lazy loading proxy"]
    end
```

---

## Pattern Interaction Diagram

```mermaid
flowchart TB
    subgraph PATTERNS["GoF Patterns Working Together"]
        direction TB

        Factory["Factory Method<br/>(DI Container)"]
        Strategy["Strategy<br/>(ITaskService)"]
        Facade["Facade<br/>(TaskService)"]
        Adapter["Adapter<br/>(Repository)"]
        Template["Template Method<br/>(Repository‹T›)"]
        Iterator["Iterator<br/>(IEnumerable)"]
    end

    Factory -->|"creates"| Strategy
    Strategy -->|"implemented by"| Facade
    Facade -->|"uses"| Adapter
    Adapter -->|"extends"| Template
    Template -->|"returns"| Iterator
```
