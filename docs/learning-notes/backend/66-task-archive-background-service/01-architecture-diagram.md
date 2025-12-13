# Architecture Diagram

## Background Service Overview

```mermaid
flowchart TB
    subgraph APP["ASP.NET Core Application"]
        direction TB
        Host["WebApplication Host"]
        BgService["TaskArchiveBackgroundService<br/>───────────<br/>Singleton Lifetime"]
    end

    subgraph DI["Dependency Injection"]
        direction TB
        ScopeFactory["IServiceScopeFactory<br/>───────────<br/>Create Scoped Services"]
        Logger["ILogger<br/>───────────<br/>Logging"]
        Config["IConfiguration<br/>───────────<br/>Settings"]
    end

    subgraph SCOPED["Scoped Services (per iteration)"]
        direction TB
        UoW["IUnitOfWork"]
        TaskRepo["ITaskRepository"]
        DbContext["ApplicationDbContext"]
    end

    subgraph DB["Database"]
        Tasks["Tasks Table<br/>───────────<br/>IsArchived, ArchivedAt"]
    end

    Host -->|"StartAsync"| BgService
    BgService --> ScopeFactory
    BgService --> Logger
    BgService --> Config
    ScopeFactory -->|"CreateScope"| UoW
    UoW --> TaskRepo
    TaskRepo --> DbContext
    DbContext --> DB
```

---

## Service Lifecycle

```mermaid
sequenceDiagram
    participant Host as WebApplication
    participant Bg as TaskArchiveBackgroundService
    participant Factory as IServiceScopeFactory
    participant UoW as IUnitOfWork
    participant Repo as ITaskRepository
    participant DB as Database

    Host->>Bg: StartAsync()
    Note over Bg: ExecuteAsync starts

    loop Every 2 seconds
        Bg->>Factory: CreateScope()
        Factory-->>Bg: IServiceScope
        Bg->>UoW: GetRequiredService()
        Bg->>Repo: GetTasksToArchiveAsync()
        Repo->>DB: Query (Done + !Archived + 5s)
        DB-->>Repo: Tasks[]

        alt Tasks found
            loop For each task
                Bg->>Bg: IsArchived = true
                Bg->>Bg: ArchivedAt = UtcNow
                Bg->>Bg: Log
            end
            Bg->>UoW: SaveChangesAsync()
            UoW->>DB: UPDATE Tasks
        end

        Bg->>Bg: Dispose Scope
        Bg->>Bg: Task.Delay(2000)
    end

    Host->>Bg: StopAsync()
    Note over Bg: CancellationToken triggered
```

---

## DI Container Structure

```mermaid
flowchart TB
    subgraph SINGLETON["Singleton Services"]
        direction TB
        BgService["TaskArchiveBackgroundService"]
        ScopeFactory["IServiceScopeFactory"]
        MemoryCache["IMemoryCache"]
        CacheService["ICacheService"]
    end

    subgraph SCOPED["Scoped Services"]
        direction TB
        UoW["IUnitOfWork"]
        TaskRepo["ITaskRepository"]
        UserRepo["IUserRepository"]
        TaskService["ITaskService"]
        DbContext["ApplicationDbContext"]
    end

    BgService -.->|"Cannot inject directly"| SCOPED
    BgService -->|"Uses"| ScopeFactory
    ScopeFactory -->|"Creates scope for"| SCOPED
```

---

## Archive Query Condition

```mermaid
flowchart LR
    subgraph CONDITION["Archive Conditions (AND)"]
        C1["Status == Done"]
        C2["IsArchived == false"]
        C3["UpdatedAt < Now - 5s"]
    end

    subgraph RESULT["Query Result"]
        Tasks["Tasks to Archive"]
    end

    C1 --> Tasks
    C2 --> Tasks
    C3 --> Tasks
```

---

## Configuration Flow

```mermaid
flowchart TB
    subgraph CONFIG["appsettings.json"]
        Settings["ArchiveSettings<br/>───────────<br/>IntervalSeconds: 2<br/>DelaySeconds: 5"]
    end

    subgraph SERVICE["TaskArchiveBackgroundService"]
        Constructor["Constructor<br/>───────────<br/>IConfiguration injection"]
        Fields["Fields<br/>───────────<br/>_intervalSeconds<br/>_delaySeconds"]
        Execute["ExecuteAsync<br/>───────────<br/>Task.Delay(_intervalSeconds * 1000)"]
    end

    CONFIG -->|"GetValue<int>"| Constructor
    Constructor --> Fields
    Fields --> Execute
```

---

## Error Handling Flow

```mermaid
flowchart TB
    subgraph LOOP["Main Loop"]
        direction TB
        Try["try block<br/>───────────<br/>Query + Archive"]
        Catch["catch (Exception)<br/>───────────<br/>LogError"]
        Delay["Task.Delay<br/>───────────<br/>Continue regardless"]
    end

    Try -->|"Success"| Delay
    Try -->|"Exception"| Catch
    Catch --> Delay
    Delay -->|"Loop"| Try
```

**Design Decision:** Service continues running even after errors to ensure eventual archiving.

---

## Graceful Shutdown

```mermaid
sequenceDiagram
    participant App as Application
    participant Host as WebHost
    participant Bg as BackgroundService
    participant Token as CancellationToken

    App->>Host: SIGTERM / Ctrl+C
    Host->>Token: Cancel()
    Token->>Bg: IsCancellationRequested = true
    Note over Bg: Current Task.Delay interrupted
    Bg->>Bg: Exit while loop
    Bg->>Bg: Log "Service stopped"
    Bg->>Host: ExecuteAsync complete
    Host->>App: Shutdown complete
```
