# Design Patterns and SOLID Principles

## Design Patterns

### 1. Mediator Pattern (via IHubContext)

```mermaid
flowchart TB
    subgraph SERVICES["Services"]
        NS["NotificationService"]
        TS["TaskService"]
    end

    subgraph MEDIATOR["Mediator"]
        HC["IHubContext‹TaskHub›"]
    end

    subgraph CLIENTS["Clients"]
        C1["Client A"]
        C2["Client B"]
        C3["Client C"]
    end

    NS --> HC
    TS --> NS
    HC --> C1
    HC --> C2
    HC --> C3
```

**Why Mediator?**
- Services don't know about individual clients
- IHubContext acts as mediator between services and clients
- Decouples notification logic from connection management

---

### 2. Observer Pattern (Publish-Subscribe)

```mermaid
flowchart LR
    subgraph PUBLISHER["Publisher"]
        NS["NotificationService"]
    end

    subgraph EVENT["Event"]
        TaskCreated["TaskCreated"]
        TaskUpdated["TaskUpdated"]
        TaskDeleted["TaskDeleted"]
    end

    subgraph SUBSCRIBERS["Subscribers (Clients)"]
        C1["Client A"]
        C2["Client B"]
    end

    NS -->|"publish"| TaskCreated
    NS -->|"publish"| TaskUpdated
    NS -->|"publish"| TaskDeleted
    TaskCreated -->|"notify"| C1
    TaskCreated -->|"notify"| C2
```

**Why Observer?**
- One-to-many notification
- Publishers don't know subscribers
- Loose coupling between event source and handlers

---

## SOLID Principles

### S - Single Responsibility Principle

```mermaid
flowchart TB
    subgraph SRP["Single Responsibility"]
        TS["TaskService<br/>───────────<br/>Task CRUD Logic"]
        NS["NotificationService<br/>───────────<br/>Real-time Notification"]
    end
```

| Service | Responsibility |
|---------|----------------|
| TaskService | Task business logic (CRUD) |
| NotificationService | Real-time notification delivery |

**Before:** TaskService handles both CRUD and notification
**After:** Each service has one reason to change

---

### O - Open/Closed Principle

```mermaid
flowchart TB
    subgraph INTERFACE["Open for Extension"]
        INS["INotificationService<br/>───────────<br/>NotifyTaskCreatedAsync()<br/>NotifyTaskUpdatedAsync()"]
    end

    subgraph IMPLEMENTATIONS["Closed for Modification"]
        NS1["NotificationService<br/>(SignalR)"]
        NS2["EmailNotificationService<br/>(Future)"]
        NS3["SlackNotificationService<br/>(Future)"]
    end

    INS --> NS1
    INS -.-> NS2
    INS -.-> NS3
```

**Benefit:** Add new notification channels without modifying TaskService

---

### D - Dependency Inversion Principle

```mermaid
flowchart TB
    subgraph HIGH["High-Level Module"]
        TS["TaskService"]
    end

    subgraph ABSTRACTION["Abstraction"]
        INS["INotificationService"]
    end

    subgraph LOW["Low-Level Module"]
        NS["NotificationService<br/>(SignalR Implementation)"]
    end

    TS -->|"depends on"| INS
    NS -->|"implements"| INS
```

**Key:** TaskService depends on abstraction (INotificationService), not concrete implementation
