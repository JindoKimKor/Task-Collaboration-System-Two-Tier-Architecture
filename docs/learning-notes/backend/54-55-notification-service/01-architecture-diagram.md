# Architecture Diagram

## NotificationService Overview

```mermaid
flowchart TB
    subgraph PRESENTATION["Presentation Layer"]
        Controller["TasksController"]
        Hub["TaskHub<br/>───────────<br/>Groups: TaskBoard"]
    end

    subgraph APPLICATION["Application Layer"]
        TaskService["TaskService<br/>───────────<br/>CreateTaskAsync()<br/>UpdateTaskAsync()<br/>DeleteTaskAsync()"]
        NotificationService["NotificationService<br/>───────────<br/>NotifyTaskCreatedAsync()<br/>NotifyTaskUpdatedAsync()<br/>NotifyTaskDeletedAsync()"]
    end

    subgraph INFRASTRUCTURE["Infrastructure"]
        HubContext["IHubContext‹TaskHub›<br/>───────────<br/>Clients.Group()"]
    end

    Controller --> TaskService
    TaskService --> NotificationService
    NotificationService --> HubContext
    HubContext --> Hub
```

---

## Notification Flow (Task Creation)

```mermaid
sequenceDiagram
    participant C as Client A
    participant API as TasksController
    participant TS as TaskService
    participant NS as NotificationService
    participant HC as IHubContext
    participant G as TaskBoard Group
    participant C2 as Client B

    C->>API: POST /api/tasks
    API->>TS: CreateTaskAsync(dto)
    TS->>TS: Save to DB
    TS->>NS: NotifyTaskCreatedAsync(task)
    NS->>HC: Clients.Group("TaskBoard")
    HC->>G: SendAsync("TaskCreated", data)
    G-->>C: TaskCreated event
    G-->>C2: TaskCreated event
    API-->>C: 201 Created
```

---

## IHubContext vs Hub

```mermaid
flowchart LR
    subgraph DIRECT["Direct Hub Access"]
        Client["Client"]
        Hub["TaskHub"]
        Client -->|"WebSocket"| Hub
    end

    subgraph CONTEXT["IHubContext Access"]
        Service["NotificationService"]
        HubContext["IHubContext‹TaskHub›"]
        Hub2["TaskHub Clients"]
        Service -->|"DI Injection"| HubContext
        HubContext -->|"SendAsync"| Hub2
    end
```

| Approach | Use Case |
|----------|----------|
| Hub | Client-initiated actions (JoinBoard, LeaveBoard) |
| IHubContext | Server-initiated broadcasts (NotificationService) |

---

## Service Layer Integration

```mermaid
flowchart TB
    subgraph BEFORE["Before (No Notification)"]
        TS1["TaskService"]
        DB1["Database"]
        TS1 --> DB1
    end

    subgraph AFTER["After (With Notification)"]
        TS2["TaskService"]
        NS["NotificationService"]
        DB2["Database"]
        HC["IHubContext"]

        TS2 --> DB2
        TS2 --> NS
        NS --> HC
    end
```

---

## DI Container Registration

```mermaid
flowchart TB
    subgraph CONTAINER["DI Container"]
        direction TB
        IHub["IHubContext‹TaskHub›<br/>(Auto-registered by AddSignalR)"]
        INS["INotificationService"]
        NS["NotificationService"]
        ITS["ITaskService"]
        TS["TaskService"]
    end

    INS --> NS
    NS -.->|"injects"| IHub
    ITS --> TS
    TS -.->|"injects"| INS
```
