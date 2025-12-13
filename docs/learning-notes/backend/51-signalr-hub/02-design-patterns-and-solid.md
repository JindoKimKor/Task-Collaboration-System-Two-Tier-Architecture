# Design Patterns and SOLID

## Design Patterns Used

### 1. Observer Pattern (via SignalR Groups)

```mermaid
flowchart TB
    subgraph SUBJECT["Subject (TaskHub)"]
        Hub["TaskHub<br/>───────────<br/>Manages subscribers"]
    end

    subgraph OBSERVERS["Observers (Clients)"]
        O1["Client A"]
        O2["Client B"]
        O3["Client C"]
    end

    Hub -->|"Notify"| O1
    Hub -->|"Notify"| O2
    Hub -->|"Notify"| O3
```

**How SignalR implements Observer:**
- Clients "subscribe" by joining a group (`JoinBoard()`)
- Hub "notifies" all subscribers via `Clients.Group("TaskBoard").SendAsync()`
- Clients "unsubscribe" by leaving group (`LeaveBoard()`)

---

### 2. Mediator Pattern

```mermaid
flowchart TB
    subgraph MEDIATOR["Mediator (TaskHub)"]
        Hub["TaskHub<br/>───────────<br/>Coordinates communication"]
    end

    subgraph COLLEAGUES["Colleagues (Clients)"]
        C1["Client A"]
        C2["Client B"]
        C3["Client C"]
    end

    C1 <-->|"via Hub"| Hub
    C2 <-->|"via Hub"| Hub
    C3 <-->|"via Hub"| Hub
```

**How TaskHub acts as Mediator:**
- Clients don't communicate directly with each other
- All communication goes through the Hub
- Hub decides who receives which messages
- Decouples clients from each other

---

### 3. Template Method Pattern

```mermaid
flowchart TB
    subgraph BASE["Hub (Base Class)"]
        OnConnected["OnConnectedAsync()<br/>───────────<br/>Template method"]
        OnDisconnected["OnDisconnectedAsync()<br/>───────────<br/>Template method"]
    end

    subgraph DERIVED["TaskHub (Derived)"]
        Override1["override OnConnectedAsync()<br/>───────────<br/>Custom logic + base call"]
        Override2["override OnDisconnectedAsync()<br/>───────────<br/>Custom logic + base call"]
    end

    BASE --> DERIVED
```

**Implementation:**
```csharp
public override async Task OnConnectedAsync()
{
    // Custom logic here (if needed)
    await base.OnConnectedAsync();  // Call base template
}
```

---

## SOLID Principles Applied

### S - Single Responsibility

```mermaid
flowchart LR
    subgraph SRP["Single Responsibility"]
        TaskHub["TaskHub<br/>───────────<br/>Manages SignalR<br/>connections only"]
        TaskService["TaskService<br/>───────────<br/>Business logic only"]
        TaskController["TasksController<br/>───────────<br/>HTTP endpoints only"]
    end
```

**TaskHub responsibilities:**
- Manage client connections
- Handle group membership
- NOT: business logic, data access

---

### O - Open/Closed

```mermaid
flowchart TB
    subgraph OCP["Open/Closed Principle"]
        Current["TaskHub<br/>───────────<br/>JoinBoard()<br/>LeaveBoard()"]
        Future["Future Extension<br/>───────────<br/>+ JoinUserChannel()<br/>+ NotifyTaskUpdate()"]
    end

    Current -->|"Extend without modify"| Future
```

**How:** Add new methods without changing existing ones

---

### L - Liskov Substitution

```mermaid
flowchart TB
    subgraph LSP["Liskov Substitution"]
        Base["Hub (Base)<br/>───────────<br/>OnConnectedAsync()<br/>OnDisconnectedAsync()"]
        Derived["TaskHub (Derived)<br/>───────────<br/>Overrides + Extensions"]
    end

    Base -->|"Can be replaced by"| Derived
```

**TaskHub extends Hub without breaking its contract**

---

### I - Interface Segregation

```mermaid
flowchart TB
    subgraph ISP["Interface Segregation"]
        Hub["Hub Base Class<br/>───────────<br/>Minimal interface"]
        TaskHub["TaskHub<br/>───────────<br/>Only implements<br/>what it needs"]
    end
```

**Hub provides:**
- `Clients` - Send to clients
- `Groups` - Manage groups
- `Context` - Connection info

**TaskHub uses only what it needs**

---

### D - Dependency Inversion

```mermaid
flowchart TB
    subgraph DIP["Dependency Inversion"]
        direction TB
        Hub["TaskHub<br/>───────────<br/>High-level"]
        Abstraction["Hub base class<br/>Groups, Clients<br/>───────────<br/>Abstraction"]
        SignalR["SignalR Infrastructure<br/>───────────<br/>Low-level"]
    end

    Hub -->|"Depends on"| Abstraction
    Abstraction -->|"Implemented by"| SignalR
```

**TaskHub doesn't know about:**
- WebSocket implementation details
- Transport layer (WebSocket, Long Polling, SSE)
- Connection management internals

---

## Anti-Patterns Avoided

```mermaid
flowchart LR
    subgraph AVOID["❌ Anti-Patterns"]
        God["God Hub<br/>All logic in Hub"]
        Direct["Direct DB Access<br/>in Hub"]
        NoGroups["Individual tracking<br/>instead of Groups"]
    end

    subgraph USE["✅ Correct Patterns"]
        Thin["Thin Hub<br/>Delegates to services"]
        Service["Service Layer<br/>for business logic"]
        Groups["SignalR Groups<br/>for broadcasting"]
    end

    God -->|"refactor"| Thin
    Direct -->|"refactor"| Service
    NoGroups -->|"use"| Groups
```
