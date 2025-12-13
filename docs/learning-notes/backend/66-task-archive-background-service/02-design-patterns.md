# Design Patterns

## Patterns Used

### 1. Background Worker Pattern

```mermaid
flowchart TB
    subgraph PATTERN["Background Worker Pattern"]
        direction TB
        Worker["BackgroundService<br/>───────────<br/>Long-running task"]
        Host["IHostedService<br/>───────────<br/>Lifecycle management"]
        Execute["ExecuteAsync<br/>───────────<br/>Main work loop"]
    end

    Host -->|"Interface"| Worker
    Worker -->|"Override"| Execute
```

**Implementation:**
```csharp
public class TaskArchiveBackgroundService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // Do work
            await Task.Delay(2000, stoppingToken);
        }
    }
}
```

**Benefits:**
- Automatic start on application startup
- Graceful shutdown with CancellationToken
- Runs independently of HTTP request lifecycle

---

### 2. Service Locator Pattern (via IServiceScopeFactory)

```mermaid
flowchart TB
    subgraph PATTERN["Service Locator via ScopeFactory"]
        direction TB
        Singleton["Singleton Service<br/>───────────<br/>BackgroundService"]
        Factory["IServiceScopeFactory<br/>───────────<br/>Locator"]
        Scope["IServiceScope<br/>───────────<br/>Container"]
        Scoped["Scoped Service<br/>───────────<br/>IUnitOfWork"]
    end

    Singleton -->|"Inject"| Factory
    Factory -->|"CreateScope"| Scope
    Scope -->|"GetRequiredService"| Scoped
```

**Implementation:**
```csharp
using var scope = _scopeFactory.CreateScope();
var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
```

**Why Service Locator here?**
- BackgroundService is Singleton
- IUnitOfWork/DbContext are Scoped
- Cannot use Constructor Injection for Scoped → Singleton
- ScopeFactory is the approved pattern for this scenario

---

### 3. Unit of Work Pattern

```mermaid
flowchart TB
    subgraph UOW["Unit of Work"]
        direction TB
        UnitOfWork["IUnitOfWork<br/>───────────<br/>Transaction coordinator"]
        Tasks["Tasks Property<br/>───────────<br/>ITaskRepository"]
        Save["SaveChangesAsync<br/>───────────<br/>Commit all changes"]
    end

    UnitOfWork --> Tasks
    UnitOfWork --> Save
```

**Implementation:**
```csharp
var tasksToArchive = await unitOfWork.Tasks.GetTasksToArchiveAsync();

foreach (var task in tasksToArchive)
{
    task.IsArchived = true;
    task.ArchivedAt = DateTime.UtcNow;
}

await unitOfWork.SaveChangesAsync(); // Single commit for all changes
```

**Benefits:**
- All archive operations committed together
- Atomic transaction
- DbContext change tracking handles updates

---

### 4. Repository Pattern

```mermaid
flowchart TB
    subgraph REPO["Repository Pattern"]
        direction TB
        Interface["ITaskRepository<br/>───────────<br/>GetTasksToArchiveAsync()"]
        Impl["TaskRepository<br/>───────────<br/>EF Core query"]
        Consumer["BackgroundService<br/>───────────<br/>Business logic"]
    end

    Consumer -->|"Uses"| Interface
    Interface -->|"Implemented by"| Impl
```

**Implementation:**
```csharp
// Interface
Task<IEnumerable<TaskItem>> GetTasksToArchiveAsync();

// Implementation
public async Task<IEnumerable<TaskItem>> GetTasksToArchiveAsync()
{
    var archiveThreshold = DateTime.UtcNow.AddSeconds(-5);
    return await _dbSet
        .Where(t => t.Status == TaskStatus.Done &&
                    !t.IsArchived &&
                    t.UpdatedAt < archiveThreshold)
        .ToListAsync();
}
```

---

### 5. Polling Pattern

```mermaid
flowchart TB
    subgraph POLLING["Polling Pattern"]
        direction TB
        Loop["While Loop<br/>───────────<br/>Continuous check"]
        Check["Query Database<br/>───────────<br/>Find eligible tasks"]
        Process["Process Tasks<br/>───────────<br/>Archive if found"]
        Wait["Task.Delay<br/>───────────<br/>Wait 2 seconds"]
    end

    Loop --> Check
    Check --> Process
    Process --> Wait
    Wait --> Loop
```

**Implementation:**
```csharp
while (!stoppingToken.IsCancellationRequested)
{
    // Poll: Check for tasks to archive
    var tasks = await unitOfWork.Tasks.GetTasksToArchiveAsync();

    // Process: Archive found tasks
    foreach (var task in tasks) { /* ... */ }

    // Wait: Sleep before next poll
    await Task.Delay(_intervalSeconds * 1000, stoppingToken);
}
```

**Alternative Patterns Not Used:**
| Pattern | Description | Why Not Used |
|---------|-------------|--------------|
| Event-Driven | React to status change event | More complex, requires event infrastructure |
| Timer-Based | System.Threading.Timer | Less control over lifecycle |
| Message Queue | RabbitMQ, Azure Service Bus | Overkill for simple archiving |

---

## Anti-Patterns Avoided

```mermaid
flowchart LR
    subgraph AVOID["Anti-Patterns Avoided"]
        Direct["Direct Scoped Injection<br/>in Singleton"]
        NoCancel["Ignoring CancellationToken"]
        NoError["No Error Handling"]
        NoLog["No Logging"]
    end

    subgraph CORRECT["Correct Patterns"]
        Factory["IServiceScopeFactory"]
        Cancel["CancellationToken check"]
        TryCatch["try-catch with continue"]
        ILogger["ILogger<T>"]
    end

    Direct -->|"Use"| Factory
    NoCancel -->|"Use"| Cancel
    NoError -->|"Use"| TryCatch
    NoLog -->|"Use"| ILogger
```
