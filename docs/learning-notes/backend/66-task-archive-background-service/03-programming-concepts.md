# Programming Concepts

## .NET Hosting Concepts

### 1. BackgroundService Abstract Class

```mermaid
flowchart TB
    subgraph HIERARCHY["Class Hierarchy"]
        IHostedService["IHostedService<br/>───────────<br/>StartAsync()<br/>StopAsync()"]
        BackgroundService["BackgroundService<br/>───────────<br/>ExecuteAsync()<br/>abstract class"]
        TaskArchive["TaskArchiveBackgroundService<br/>───────────<br/>Our implementation"]
    end

    IHostedService -->|"Implements"| BackgroundService
    BackgroundService -->|"Inherits"| TaskArchive
```

**Key Methods:**
| Method | Description |
|--------|-------------|
| `ExecuteAsync(CancellationToken)` | Override this for your work logic |
| `StartAsync(CancellationToken)` | Called on app startup (inherited) |
| `StopAsync(CancellationToken)` | Called on app shutdown (inherited) |

---

### 2. IHostedService Registration

```csharp
// Program.cs
builder.Services.AddHostedService<TaskArchiveBackgroundService>();
```

**What this does:**
- Registers as Singleton
- Adds to IHostedService collection
- Host starts all IHostedService on startup
- Host stops all on shutdown

---

### 3. CancellationToken

```mermaid
stateDiagram-v2
    [*] --> Running: Service starts
    Running --> Running: Loop continues
    Running --> Cancelling: SIGTERM / StopAsync
    Cancelling --> Stopped: Exit loop
    Stopped --> [*]
```

**Implementation:**
```csharp
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        // Work...
        await Task.Delay(2000, stoppingToken); // Throws on cancel
    }
}
```

**Key Points:**
- `stoppingToken.IsCancellationRequested` - Check before work
- `Task.Delay(ms, token)` - Cancellable delay
- Thrown `OperationCanceledException` is handled by framework

---

## Dependency Injection Concepts

### 4. Service Lifetimes

```mermaid
flowchart TB
    subgraph SINGLETON["Singleton"]
        S1["One instance per app lifetime"]
        S2["BackgroundService"]
        S3["IMemoryCache"]
    end

    subgraph SCOPED["Scoped"]
        SC1["One instance per scope/request"]
        SC2["IUnitOfWork"]
        SC3["DbContext"]
    end

    subgraph TRANSIENT["Transient"]
        T1["New instance every time"]
        T2["Lightweight services"]
    end
```

**Problem:**
```csharp
// This FAILS - cannot inject Scoped into Singleton
public class TaskArchiveBackgroundService : BackgroundService
{
    public TaskArchiveBackgroundService(IUnitOfWork unitOfWork) // ERROR!
    {
    }
}
```

**Solution:**
```csharp
public class TaskArchiveBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public TaskArchiveBackgroundService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
    }
}
```

---

### 5. IServiceScopeFactory

```mermaid
flowchart TB
    subgraph FACTORY["IServiceScopeFactory"]
        Method["CreateScope()<br/>───────────<br/>Returns IServiceScope"]
    end

    subgraph SCOPE["IServiceScope"]
        Provider["ServiceProvider<br/>───────────<br/>Access services"]
        Disposable["IDisposable<br/>───────────<br/>Cleanup resources"]
    end

    FACTORY -->|"Creates"| SCOPE
```

**Usage Pattern:**
```csharp
using var scope = _scopeFactory.CreateScope(); // using = auto-dispose
var service = scope.ServiceProvider.GetRequiredService<IService>();
// Use service...
// Scope disposed at end of block, DbContext cleaned up
```

---

## Configuration Concepts

### 6. IConfiguration.GetValue<T>

```csharp
// appsettings.json
{
  "ArchiveSettings": {
    "IntervalSeconds": 2,
    "DelaySeconds": 5
  }
}

// Reading values
_intervalSeconds = configuration.GetValue<int>("ArchiveSettings:IntervalSeconds", 2);
//                                             ^path                              ^default
```

**Path Syntax:**
- Use `:` to navigate nested JSON
- `GetValue<T>(path, defaultValue)` returns default if not found

---

## Async/Await Concepts

### 7. async Task Pattern

```mermaid
flowchart TB
    subgraph ASYNC["Async Method"]
        Signature["async Task MethodAsync()"]
        Await1["await Task.Delay()"]
        Await2["await unitOfWork.SaveChangesAsync()"]
    end

    Signature --> Await1
    Await1 -->|"Non-blocking"| Await2
```

**Key Points:**
- `async Task` - Returns Task (void-like for async)
- `await` - Non-blocking wait
- Thread returns to pool during delay
- Efficient resource usage

---

### 8. Task.Delay vs Thread.Sleep

| Method | Behavior |
|--------|----------|
| `await Task.Delay(ms)` | Non-blocking, releases thread |
| `Thread.Sleep(ms)` | Blocking, holds thread |

**Always use `Task.Delay` in async code:**
```csharp
// Correct
await Task.Delay(2000, stoppingToken);

// Wrong - blocks thread
Thread.Sleep(2000);
```

---

## Entity Framework Concepts

### 9. Change Tracking

```mermaid
flowchart TB
    subgraph TRACKING["EF Core Change Tracking"]
        Query["Query entities<br/>───────────<br/>DbContext tracks them"]
        Modify["Modify properties<br/>───────────<br/>Changes detected"]
        Save["SaveChangesAsync<br/>───────────<br/>Generate UPDATE SQL"]
    end

    Query --> Modify --> Save
```

**Implementation:**
```csharp
var tasks = await unitOfWork.Tasks.GetTasksToArchiveAsync(); // Tracked

foreach (var task in tasks)
{
    task.IsArchived = true;      // Change detected
    task.ArchivedAt = DateTime.UtcNow;
}

await unitOfWork.SaveChangesAsync(); // Generates UPDATE statements
```

---

### 10. DateTime.UtcNow

```csharp
var archiveThreshold = DateTime.UtcNow.AddSeconds(-5);
```

**Why UTC?**
- Server-agnostic time
- No timezone issues
- Database stores UTC
- Convert to local only for display

---

## Logging Concepts

### 11. ILogger<T> Structured Logging

```csharp
private readonly ILogger<TaskArchiveBackgroundService> _logger;

_logger.LogInformation("Archived task {Id}: {Title}", task.Id, task.Title);
//                     ^message template        ^parameters (not string interpolation!)
```

**Structured Logging Benefits:**
- Parameters captured as structured data
- Searchable in log aggregators (Seq, ELK)
- Better performance than string interpolation

**Log Levels:**
| Level | Usage |
|-------|-------|
| `LogDebug` | Detailed diagnostic info |
| `LogInformation` | Normal flow events |
| `LogWarning` | Unexpected but handled |
| `LogError` | Exceptions, failures |
| `LogCritical` | App crash scenarios |
