# Architecture Diagram

## Cache Status UI Overview

```mermaid
flowchart TB
    subgraph FRONTEND["Frontend (React)"]
        direction TB
        Page["TaskDetailsPage.tsx<br/>───────────<br/>Cache Badge UI"]
        Thunk["taskThunks.ts<br/>───────────<br/>fetchTaskById"]
        Service["taskService.ts<br/>───────────<br/>X-Cache Header 추출"]
        Slice["taskSlice.ts<br/>───────────<br/>cacheStatus State"]
    end

    subgraph BACKEND["Backend (ASP.NET)"]
        direction TB
        Controller["TasksController<br/>───────────<br/>X-Cache Header 설정"]
        TaskService["TaskService<br/>───────────<br/>Cache-Aside Pattern"]
        Cache["CacheService<br/>───────────<br/>IMemoryCache"]
    end

    Page -->|"dispatch"| Thunk
    Thunk -->|"call"| Service
    Service <-->|"HTTP + Header"| Controller
    Controller -->|"cacheHit"| TaskService
    TaskService <-->|"Get/Set"| Cache
    Service -->|"{ data, cacheStatus }"| Thunk
    Thunk -->|"fulfilled"| Slice
    Slice -->|"useAppSelector"| Page
```

---

## X-Cache Header 전달 흐름

```mermaid
sequenceDiagram
    participant Page as TaskDetailsPage
    participant Service as taskService
    participant Backend as TasksController
    participant Cache as CacheService

    Note over Page: Component mounts
    Page->>Service: getTaskById(id)
    Service->>Backend: GET /api/tasks/{id}

    Backend->>Cache: Get<TaskResponseDto>("task_1")

    alt Cache HIT
        Cache-->>Backend: cached data
        Backend-->>Service: Response + X-Cache: HIT
    else Cache MISS
        Cache-->>Backend: null
        Backend->>Backend: Query Database (2s delay)
        Backend->>Cache: Set("task_1", dto)
        Backend-->>Service: Response + X-Cache: MISS
    end

    Service->>Service: Extract headers["x-cache"]
    Service-->>Page: { data, cacheStatus }

    Note over Page: Update Redux State
    Note over Page: Render Cache Badge
```

---

## Redux State 구조

```mermaid
flowchart TB
    subgraph STORE["Redux Store"]
        direction TB
        subgraph TASK["taskSlice"]
            State["TaskState<br/>───────────<br/>tasks: []<br/>selectedTask: Task | null<br/>cacheStatus: 'HIT' | 'MISS' | null<br/>loading: boolean<br/>error: string | null"]
        end
    end

    subgraph ACTIONS["Thunk Actions"]
        Pending["fetchTaskById.pending<br/>───────────<br/>loading: true"]
        Fulfilled["fetchTaskById.fulfilled<br/>───────────<br/>selectedTask: payload.data<br/>cacheStatus: payload.cacheStatus"]
        Rejected["fetchTaskById.rejected<br/>───────────<br/>error: message"]
    end

    Pending --> State
    Fulfilled --> State
    Rejected --> State
```

---

## CORS Header Exposure

```mermaid
flowchart LR
    subgraph WITHOUT["Without WithExposedHeaders"]
        direction TB
        Backend1["Backend<br/>X-Cache: HIT"]
        Browser1["Browser Security"]
        Frontend1["Frontend<br/>headers['x-cache'] = undefined"]
        Backend1 -->|"blocked"| Browser1
        Browser1 -->|"❌"| Frontend1
    end

    subgraph WITH["With WithExposedHeaders"]
        direction TB
        Backend2["Backend<br/>X-Cache: HIT"]
        Browser2["CORS Policy<br/>WithExposedHeaders('X-Cache')"]
        Frontend2["Frontend<br/>headers['x-cache'] = 'HIT'"]
        Backend2 -->|"allowed"| Browser2
        Browser2 -->|"✅"| Frontend2
    end
```

---

## React StrictMode 영향

```mermaid
sequenceDiagram
    participant React as React StrictMode
    participant Page as TaskDetailsPage
    participant API as Backend API
    participant Cache as Server Cache

    Note over React: Development Mode

    React->>Page: Mount (1st)
    Page->>API: GET /tasks/1
    API->>Cache: Check cache
    Cache-->>API: MISS
    API-->>Page: X-Cache: MISS (2s delay)

    React->>Page: Unmount (cleanup)

    React->>Page: Mount (2nd)
    Page->>API: GET /tasks/1
    API->>Cache: Check cache
    Cache-->>API: HIT (data exists now)
    API-->>Page: X-Cache: HIT (instant)

    Note over Page: Final state shows HIT<br/>(2nd call overwrites 1st)
```

---

## Production vs Development

```mermaid
flowchart TB
    subgraph DEV["Development (StrictMode)"]
        direction TB
        Mount1["Mount (1st)"]
        Call1["API Call → MISS"]
        Unmount["Unmount"]
        Mount2["Mount (2nd)"]
        Call2["API Call → HIT"]
        Result1["UI: Cache HIT ❌"]

        Mount1 --> Call1
        Call1 --> Unmount
        Unmount --> Mount2
        Mount2 --> Call2
        Call2 --> Result1
    end

    subgraph PROD["Production (No StrictMode)"]
        direction TB
        MountP["Mount"]
        CallP["API Call → MISS"]
        ResultP["UI: Cache MISS ✅"]

        MountP --> CallP
        CallP --> ResultP
    end
```

---

## Component Rendering

```mermaid
flowchart TB
    subgraph PAGE["TaskDetailsPage"]
        direction TB
        Hook["useAppSelector<br/>{ cacheStatus }"]
        Condition{{"cacheStatus !== null?"}}
        Badge["Cache Badge<br/>───────────<br/>HIT: bg-green-100<br/>MISS: bg-yellow-100"]
        NoBadge["No Badge"]
    end

    Hook --> Condition
    Condition -->|"Yes"| Badge
    Condition -->|"No"| NoBadge
```

---

## Cache Badge Styles

```mermaid
flowchart LR
    subgraph STYLES["Badge Styles"]
        HIT["Cache: HIT<br/>───────────<br/>bg-green-100<br/>text-green-800"]
        MISS["Cache: MISS<br/>───────────<br/>bg-yellow-100<br/>text-yellow-800"]
    end
```
