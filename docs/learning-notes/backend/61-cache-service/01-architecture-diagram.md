# Cache Service Architecture

## 전체 아키텍처

```mermaid
flowchart TB
    subgraph CLIENT["Client (Browser)"]
        Request["GET /api/tasks/5"]
        Response["Response + X-Cache Header"]
    end

    subgraph CONTROLLER["Presentation Layer"]
        TasksController["TasksController<br/>─────────────<br/>GetTask(id)<br/>→ X-Cache 헤더 설정"]
    end

    subgraph SERVICE["Application Layer"]
        TaskService["TaskService<br/>─────────────<br/>GetTaskByIdAsync(id)<br/>→ 캐시 체크/저장/무효화"]
        CacheService["CacheService<br/>─────────────<br/>Get / Set / Remove"]
    end

    subgraph CACHE["In-Memory Cache"]
        MemoryCache["IMemoryCache<br/>─────────────<br/>task_5 → TaskResponseDto<br/>TTL: 5분"]
    end

    subgraph DATA["Data Layer"]
        Repository["TaskRepository<br/>─────────────<br/>GetByIdWithDetailsAsync"]
        DB[(Database)]
    end

    CLIENT --> CONTROLLER
    CONTROLLER --> TaskService
    TaskService --> CacheService
    CacheService --> MemoryCache
    TaskService --> Repository
    Repository --> DB
    CONTROLLER --> CLIENT
```

---

## Cache Service 구조

```mermaid
classDiagram
    class ICacheService {
        <<interface>>
        +Get~T~(key) T?
        +Set~T~(key, value, ttl?) void
        +Remove(key) void
    }

    class CacheService {
        -IMemoryCache _cache
        -TimeSpan _defaultTtl
        +Get~T~(key) T?
        +Set~T~(key, value, ttl?) void
        +Remove(key) void
    }

    class IMemoryCache {
        <<.NET Built-in>>
        +TryGetValue(key, out value) bool
        +Set(key, value, options) void
        +Remove(key) void
    }

    ICacheService <|.. CacheService : implements
    CacheService --> IMemoryCache : uses
```

---

## TaskService with Cache

```mermaid
classDiagram
    class TaskService {
        -IUnitOfWork _unitOfWork
        -INotificationService _notificationService
        -ICacheService _cacheService
        -int _simulatedDelaySeconds
        +GetTaskByIdAsync(id) Task~(TaskResponseDto?, bool)~
        +UpdateTaskAsync(...) Task~TaskResponseDto~
        +DeleteTaskAsync(...) Task
    }

    class ICacheService {
        <<interface>>
        +Get~T~(key) T?
        +Set~T~(key, value, ttl?) void
        +Remove(key) void
    }

    class IUnitOfWork {
        <<interface>>
        +Tasks ITaskRepository
    }

    TaskService --> ICacheService : 캐싱
    TaskService --> IUnitOfWork : DB 조회
```

---

## DI Container 구성

```mermaid
flowchart TB
    subgraph DI["Dependency Injection Container"]
        direction TB

        subgraph SINGLETON["Singleton (앱 전체 공유)"]
            MemCache["IMemoryCache<br/>AddMemoryCache()"]
            Cache["ICacheService → CacheService"]
        end

        subgraph SCOPED["Scoped (요청당 1개)"]
            Task["ITaskService → TaskService"]
            UoW["IUnitOfWork → UnitOfWork"]
            Notify["INotificationService → NotificationService"]
        end
    end

    Cache --> MemCache
    Task --> Cache
    Task --> UoW
    Task --> Notify
```

**Singleton vs Scoped:**
- `CacheService`: Singleton - 모든 요청이 같은 캐시 인스턴스 공유
- `TaskService`: Scoped - 요청마다 새 인스턴스 (DB 트랜잭션 분리)

---

## 레이어별 책임

```mermaid
flowchart LR
    subgraph PRESENTATION["Presentation Layer"]
        direction TB
        P1["TasksController"]
        P2["• 요청 처리"]
        P3["• X-Cache 헤더 설정"]
        P4["• HTTP 응답 반환"]
    end

    subgraph APPLICATION["Application Layer"]
        direction TB
        A1["TaskService"]
        A2["• 비즈니스 로직"]
        A3["• 캐시 HIT/MISS 판단"]
        A4["• 캐시 무효화"]

        A5["CacheService"]
        A6["• 캐시 추상화"]
        A7["• TTL 관리"]
    end

    subgraph DATA["Data Layer"]
        direction TB
        D1["Repository"]
        D2["• DB 조회"]
        D3["• Entity 반환"]
    end

    PRESENTATION --> APPLICATION --> DATA
```

---

## Configuration 구조

```mermaid
flowchart TB
    subgraph CONFIG["appsettings.json"]
        Settings["CacheSettings:<br/>─────────────<br/>TaskCacheTTLMinutes: 5<br/>SimulatedDelaySeconds: 2"]
    end

    subgraph SERVICE["CacheService Constructor"]
        Read["configuration.GetValue‹int›(<br/>  'CacheSettings:TaskCacheTTLMinutes',<br/>  5  // default<br/>)"]
        TTL["_defaultTtl = TimeSpan.FromMinutes(5)"]
    end

    subgraph TASKSERVICE["TaskService Constructor"]
        Delay["_simulatedDelaySeconds = configuration.GetValue‹int›(<br/>  'CacheSettings:SimulatedDelaySeconds',<br/>  2  // default<br/>)"]
    end

    CONFIG --> Read --> TTL
    CONFIG --> Delay
```
