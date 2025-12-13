# Architecture Diagram

## SignalR Overview

```mermaid
flowchart TB
    subgraph CLIENT["Frontend (Browser)"]
        direction TB
        BoardPage["BoardPage.tsx"]
        SignalRClient["@microsoft/signalr<br/>───────────<br/>HubConnection"]
    end

    subgraph SERVER["Backend (ASP.NET Core)"]
        direction TB
        Hub["TaskHub : Hub<br/>───────────<br/>JoinBoard()<br/>LeaveBoard()"]
        Groups["SignalR Groups<br/>───────────<br/>TaskBoard"]
    end

    BoardPage -->|"uses"| SignalRClient
    SignalRClient <-->|"WebSocket<br/>/hubs/tasks"| Hub
    Hub -->|"manages"| Groups
```

---

## Hub Connection Flow

```mermaid
sequenceDiagram
    participant C as Client (Browser)
    participant H as TaskHub
    participant G as Groups

    Note over C,G: Connection Phase
    C->>H: Connect to /hubs/tasks
    H->>H: OnConnectedAsync()
    H-->>C: Connection established

    Note over C,G: Join Board
    C->>H: JoinBoard()
    H->>G: AddToGroupAsync("TaskBoard")
    H-->>C: Joined group

    Note over C,G: Leave Board
    C->>H: LeaveBoard()
    H->>G: RemoveFromGroupAsync("TaskBoard")
    H-->>C: Left group

    Note over C,G: Disconnect Phase
    C->>H: Disconnect
    H->>H: OnDisconnectedAsync()
```

---

## Program.cs Configuration Flow

```mermaid
flowchart TB
    subgraph SERVICES["Service Registration"]
        direction TB
        AddSignalR["builder.Services.AddSignalR()"]
    end

    subgraph MIDDLEWARE["Middleware Pipeline"]
        direction TB
        CORS["app.UseCors('AllowFrontend')"]
        Auth["app.UseAuthentication()"]
        Authz["app.UseAuthorization()"]
    end

    subgraph ENDPOINTS["Endpoint Mapping"]
        direction TB
        Controllers["app.MapControllers()"]
        Hub["app.MapHub‹TaskHub›('/hubs/tasks')"]
    end

    SERVICES --> MIDDLEWARE --> ENDPOINTS
```

---

## SignalR Groups Concept

```mermaid
flowchart TB
    subgraph HUB["TaskHub"]
        direction TB
        Group["TaskBoard Group"]
    end

    subgraph CLIENTS["Connected Clients"]
        C1["User A<br/>ConnectionId: abc123"]
        C2["User B<br/>ConnectionId: def456"]
        C3["User C<br/>ConnectionId: ghi789"]
    end

    C1 -->|"JoinBoard()"| Group
    C2 -->|"JoinBoard()"| Group
    C3 -->|"JoinBoard()"| Group

    Group -->|"Broadcast"| C1
    Group -->|"Broadcast"| C2
    Group -->|"Broadcast"| C3
```

**Why Groups?**
- Send messages to specific subset of clients
- Users on BoardPage join "TaskBoard" group
- When task changes, broadcast only to group members
- Efficient: no need to track individual connections

---

## Layer Architecture

```mermaid
flowchart TB
    subgraph PRESENTATION["Presentation Layer"]
        Controllers["Controllers/<br/>───────────<br/>TasksController<br/>AuthController"]
        Hubs["Hubs/<br/>───────────<br/>TaskHub"]
    end

    subgraph APPLICATION["Application Layer"]
        Services["Services/<br/>───────────<br/>TaskService<br/>AuthService"]
    end

    subgraph DATA["Data Layer"]
        Repos["Repositories/<br/>───────────<br/>TaskRepository"]
        Context["ApplicationDbContext"]
    end

    Controllers --> Services
    Hubs --> Services
    Services --> Repos
    Repos --> Context
```

**Note:** Hubs are part of Presentation Layer, same level as Controllers

---

## WebSocket vs HTTP

```mermaid
flowchart LR
    subgraph HTTP["HTTP (REST API)"]
        direction TB
        Req["Request"]
        Res["Response"]
        Req --> Res
    end

    subgraph WS["WebSocket (SignalR)"]
        direction TB
        Conn["Persistent Connection"]
        Bi["Bi-directional<br/>Communication"]
        Conn --> Bi
    end

    HTTP -->|"Stateless<br/>Request/Response"| API["Controllers"]
    WS -->|"Stateful<br/>Real-time"| Hub["Hubs"]
```

| Feature | HTTP | WebSocket (SignalR) |
|---------|------|---------------------|
| Connection | New per request | Persistent |
| Direction | Client → Server | Bi-directional |
| Use case | CRUD operations | Real-time updates |
| State | Stateless | Stateful |
