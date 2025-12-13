# Cache Flow Diagrams

## Cache HIT Flow (빠른 응답)

```mermaid
sequenceDiagram
    participant C as Client
    participant Ctrl as TasksController
    participant Svc as TaskService
    participant Cache as CacheService
    participant Mem as IMemoryCache

    C->>Ctrl: GET /api/tasks/5
    Ctrl->>Svc: GetTaskByIdAsync(5)

    Note over Svc: cacheKey = "task_5"

    Svc->>Cache: Get<TaskResponseDto>("task_5")
    Cache->>Mem: TryGetValue("task_5", out value)
    Mem-->>Cache: true, cachedTask

    Note over Cache: Cache HIT!

    Cache-->>Svc: cachedTask
    Svc-->>Ctrl: (cachedTask, cacheHit: true)

    Note over Ctrl: Response.Headers["X-Cache"] = "HIT"

    Ctrl-->>C: 200 OK + X-Cache: HIT<br/>~5ms 응답
```

**결과:**
- 응답 시간: ~5ms
- DB 조회: 없음
- X-Cache: HIT

---

## Cache MISS Flow (느린 응답)

```mermaid
sequenceDiagram
    participant C as Client
    participant Ctrl as TasksController
    participant Svc as TaskService
    participant Cache as CacheService
    participant Mem as IMemoryCache
    participant Repo as TaskRepository
    participant DB as Database

    C->>Ctrl: GET /api/tasks/5
    Ctrl->>Svc: GetTaskByIdAsync(5)

    Note over Svc: cacheKey = "task_5"

    Svc->>Cache: Get<TaskResponseDto>("task_5")
    Cache->>Mem: TryGetValue("task_5", out value)
    Mem-->>Cache: false (not found)

    Note over Cache: Cache MISS!

    Cache-->>Svc: null

    Note over Svc: 2초 지연 시뮬레이션<br/>(데모용)

    Svc->>Repo: GetByIdWithDetailsAsync(5)
    Repo->>DB: SELECT * FROM Tasks...
    DB-->>Repo: TaskItem entity
    Repo-->>Svc: task

    Note over Svc: MapToDto(task)

    Svc->>Cache: Set("task_5", dto, null)
    Cache->>Mem: Set("task_5", dto, options)

    Note over Mem: TTL: 5분

    Svc-->>Ctrl: (dto, cacheHit: false)

    Note over Ctrl: Response.Headers["X-Cache"] = "MISS"

    Ctrl-->>C: 200 OK + X-Cache: MISS<br/>~2050ms 응답
```

**결과:**
- 응답 시간: ~2050ms (2초 지연 + DB 조회)
- DB 조회: 있음
- X-Cache: MISS
- 캐시에 저장됨

---

## Cache Invalidation Flow (Update)

```mermaid
sequenceDiagram
    participant C as Client
    participant Ctrl as TasksController
    participant Svc as TaskService
    participant Cache as CacheService
    participant Mem as IMemoryCache
    participant Repo as TaskRepository
    participant DB as Database

    C->>Ctrl: PUT /api/tasks/5

    Ctrl->>Svc: UpdateTaskAsync(5, request, ...)

    Svc->>Repo: GetByIdWithDetailsAsync(5)
    Repo->>DB: SELECT
    DB-->>Repo: task
    Repo-->>Svc: task

    Note over Svc: 권한 체크<br/>task 업데이트

    Svc->>Repo: EditAsync(task)
    Svc->>Repo: SaveChangesAsync()
    Repo->>DB: UPDATE
    DB-->>Repo: OK

    Note over Svc,Cache: 캐시 무효화!

    Svc->>Cache: Remove("task_5")
    Cache->>Mem: Remove("task_5")

    Note over Mem: task_5 삭제됨

    Svc-->>Ctrl: updatedDto
    Ctrl-->>C: 200 OK

    Note over C: 다음 GET /api/tasks/5는<br/>Cache MISS가 됨
```

---

## Cache Invalidation Flow (Delete)

```mermaid
sequenceDiagram
    participant C as Client
    participant Ctrl as TasksController
    participant Svc as TaskService
    participant Cache as CacheService
    participant Mem as IMemoryCache
    participant Repo as TaskRepository
    participant DB as Database

    C->>Ctrl: DELETE /api/tasks/5

    Ctrl->>Svc: DeleteTaskAsync(5, userId, role)

    Svc->>Repo: GetByIdAsync(5)
    Repo->>DB: SELECT
    DB-->>Repo: task
    Repo-->>Svc: task

    Note over Svc: 권한 체크

    Svc->>Repo: DeleteAsync(task)
    Svc->>Repo: SaveChangesAsync()
    Repo->>DB: DELETE
    DB-->>Repo: OK

    Note over Svc,Cache: 캐시 무효화!

    Svc->>Cache: Remove("task_5")
    Cache->>Mem: Remove("task_5")

    Note over Mem: task_5 삭제됨<br/>(이미 없어도 에러 없음)

    Svc-->>Ctrl: void
    Ctrl-->>C: 204 No Content
```

---

## TTL Expiration Flow

```mermaid
flowchart TB
    subgraph TIME0["T+0분: 첫 요청"]
        A1["GET /api/tasks/5"]
        A2["Cache MISS → DB 조회"]
        A3["캐시 저장 (TTL: 5분)"]
    end

    subgraph TIME2["T+2분: 두 번째 요청"]
        B1["GET /api/tasks/5"]
        B2["Cache HIT ✓"]
        B3["즉시 응답 (~5ms)"]
    end

    subgraph TIME5["T+5분: TTL 만료"]
        C1["캐시 자동 삭제"]
        C2["(IMemoryCache 내부 처리)"]
    end

    subgraph TIME6["T+6분: 세 번째 요청"]
        D1["GET /api/tasks/5"]
        D2["Cache MISS (만료됨)"]
        D3["DB 조회 → 캐시 재저장"]
    end

    TIME0 --> TIME2 --> TIME5 --> TIME6
```

---

## 전체 Cache Key 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    IMemoryCache                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Key: "task_1"  →  Value: TaskResponseDto { Id: 1, ... }   │
│                    Expiry: 2024-01-15 10:05:00              │
│                                                              │
│  Key: "task_5"  →  Value: TaskResponseDto { Id: 5, ... }   │
│                    Expiry: 2024-01-15 10:07:30              │
│                                                              │
│  Key: "task_12" →  Value: TaskResponseDto { Id: 12, ... }  │
│                    Expiry: 2024-01-15 10:08:45              │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Cache Key Format: task_{id}
TTL: 5분 (AbsoluteExpirationRelativeToNow)
```
