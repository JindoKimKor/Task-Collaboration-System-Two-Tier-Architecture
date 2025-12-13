# SignalR Infrastructure Overview

## Introduction

이 문서는 SignalR 실시간 통신 인프라의 전체 구조를 설명합니다.
Backend, Frontend, Browser, Network 레이어를 모두 포함합니다.

**관련 구현:**
- Task #51: Backend TaskHub
- Task #52: Frontend SignalR Client
- (향후) Task #53+: Real-time notifications

---

## Full Stack Architecture

```mermaid
flowchart TB
    subgraph BROWSER["🌐 Web Browser"]
        direction TB
        React["React Application<br/>───────────<br/>BoardPage.tsx"]
        SignalRClient["@microsoft/signalr<br/>───────────<br/>HubConnection"]
        WebSocket["WebSocket API<br/>───────────<br/>Browser Built-in"]
    end

    subgraph NETWORK["🔌 Network Layer"]
        direction TB
        HTTPS["HTTPS/WSS<br/>───────────<br/>Port 5001"]
    end

    subgraph SERVER["🖥️ ASP.NET Core Server"]
        direction TB
        Kestrel["Kestrel Web Server<br/>───────────<br/>HTTP/WebSocket Handler"]
        Middleware["Middleware Pipeline<br/>───────────<br/>CORS → Auth → Routing"]
        SignalRServer["SignalR Server<br/>───────────<br/>Hub Management"]
        TaskHub["TaskHub : Hub<br/>───────────<br/>JoinBoard/LeaveBoard"]
    end

    subgraph MEMORY["💾 Server Memory"]
        direction TB
        Connections["Connection Manager<br/>───────────<br/>ConnectionId → User"]
        Groups["Group Manager<br/>───────────<br/>TaskBoard → Connections"]
    end

    React --> SignalRClient
    SignalRClient --> WebSocket
    WebSocket <--> HTTPS
    HTTPS <--> Kestrel
    Kestrel --> Middleware
    Middleware --> SignalRServer
    SignalRServer --> TaskHub
    TaskHub --> Connections
    TaskHub --> Groups
```

---

## Connection Establishment Flow

```mermaid
sequenceDiagram
    participant Browser as 🌐 Browser
    participant WSApi as WebSocket API
    participant Network as 🔌 Network
    participant Kestrel as Kestrel
    participant Middleware as Middleware
    participant Hub as TaskHub

    Note over Browser,Hub: Phase 1: HTTP Negotiation
    Browser->>Network: GET /hubs/tasks/negotiate
    Network->>Kestrel: HTTP Request
    Kestrel->>Middleware: Route to SignalR
    Middleware->>Middleware: Validate JWT
    Middleware-->>Browser: connectionId, transports[]

    Note over Browser,Hub: Phase 2: WebSocket Upgrade
    Browser->>WSApi: new WebSocket()
    WSApi->>Network: GET /hubs/tasks?id={connectionId}
    Network->>Kestrel: Upgrade: websocket
    Kestrel->>Kestrel: Protocol Switch
    Kestrel-->>Browser: 101 Switching Protocols

    Note over Browser,Hub: Phase 3: SignalR Handshake
    Browser->>Hub: {"protocol":"json","version":1}
    Hub-->>Browser: {}

    Note over Browser,Hub: Phase 4: Ready
    Browser->>Hub: invoke("JoinBoard")
    Hub->>Hub: Groups.AddToGroupAsync
    Hub-->>Browser: Joined
```

---

## Transport Layer Details

### WebSocket (Primary Transport)

```mermaid
flowchart LR
    subgraph CLIENT["Client Side"]
        JS["JavaScript<br/>HubConnection"]
        WS["WebSocket<br/>Binary Frames"]
    end

    subgraph SERVER["Server Side"]
        Kestrel["Kestrel<br/>WebSocket Handler"]
        SignalR["SignalR<br/>Message Parser"]
    end

    JS <-->|"JSON Messages"| WS
    WS <-->|"TCP (Full Duplex)"| Kestrel
    Kestrel <-->|"Parsed Messages"| SignalR
```

**WebSocket Characteristics:**
| Feature | Description |
|---------|-------------|
| Protocol | `wss://` (WebSocket Secure) |
| Connection | Persistent, bi-directional |
| Port | Same as HTTPS (5001) |
| Latency | Very low (no HTTP overhead) |
| Firewall | Usually allowed (uses port 443/5001) |

---

### Transport Fallback

```mermaid
flowchart TB
    subgraph NEGOTIATE["Negotiation"]
        Check["Check Available Transports"]
    end

    subgraph TRANSPORTS["Transport Priority"]
        WS["1. WebSocket<br/>───────────<br/>Best: Full duplex"]
        SSE["2. Server-Sent Events<br/>───────────<br/>Fallback: Server → Client only"]
        LP["3. Long Polling<br/>───────────<br/>Last resort: HTTP requests"]
    end

    Check --> WS
    WS -->|"Not available"| SSE
    SSE -->|"Not available"| LP
```

**When fallbacks are used:**
- WebSocket blocked by proxy/firewall
- Old browser without WebSocket support
- Network issues with persistent connections

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client as 🌐 Client
    participant SignalR as SignalR Client
    participant Server as 🖥️ Server
    participant JWT as JWT Middleware
    participant Hub as TaskHub

    Note over Client,Hub: Token Retrieval
    Client->>SignalR: start()
    SignalR->>SignalR: accessTokenFactory()
    SignalR->>SignalR: localStorage.getItem("token")

    Note over Client,Hub: Connection with Token
    SignalR->>Server: Connect + Authorization: Bearer {token}
    Server->>JWT: Validate Token
    JWT->>JWT: Check signature, expiry
    JWT-->>Server: User Claims (userId, role)
    Server->>Hub: OnConnectedAsync()
    Hub->>Hub: Context.User available
    Hub-->>Client: Connected
```

**Code Reference:**
```typescript
// Frontend: accessTokenFactory
.withUrl(HUB_URL, {
  accessTokenFactory: () => localStorage.getItem("token") || "",
})

// Backend: [Authorize] attribute
[Authorize]
public class TaskHub : Hub
```

---

## Group Management

```mermaid
flowchart TB
    subgraph HUB["TaskHub"]
        GroupMgr["Group Manager"]
    end

    subgraph GROUPS["SignalR Groups (In-Memory)"]
        TaskBoard["TaskBoard Group<br/>───────────<br/>Users viewing board"]
    end

    subgraph CONNECTIONS["Active Connections"]
        C1["User A<br/>conn: abc123"]
        C2["User B<br/>conn: def456"]
        C3["User C<br/>conn: ghi789"]
    end

    C1 -->|"JoinBoard()"| TaskBoard
    C2 -->|"JoinBoard()"| TaskBoard
    C3 -->|"JoinBoard()"| TaskBoard

    GroupMgr -->|"Manages"| TaskBoard
    TaskBoard -->|"Contains"| C1
    TaskBoard -->|"Contains"| C2
    TaskBoard -->|"Contains"| C3
```

**Group Lifecycle:**
1. User navigates to BoardPage
2. `JoinBoard()` called → Added to "TaskBoard" group
3. User leaves BoardPage
4. `LeaveBoard()` called → Removed from group
5. If user disconnects without leaving → Auto-removed

---

## Message Flow (Future Implementation)

```mermaid
sequenceDiagram
    participant UserA as User A (Editor)
    participant API as REST API
    participant Service as TaskService
    participant Hub as TaskHub
    participant Group as TaskBoard Group
    participant UserB as User B (Viewer)
    participant UserC as User C (Viewer)

    Note over UserA,UserC: Task Update Scenario
    UserA->>API: PUT /api/tasks/1
    API->>Service: UpdateTaskAsync()
    Service->>Service: Save to DB

    Note over UserA,UserC: Real-time Notification
    Service->>Hub: NotifyTaskUpdated(taskDto)
    Hub->>Group: Clients.Group("TaskBoard")
    Group->>UserB: TaskUpdated event
    Group->>UserC: TaskUpdated event
    UserB->>UserB: Update UI
    UserC->>UserC: Update UI
```

**향후 구현 예정:**
- NotificationService (Application Layer)
- TaskUpdated, TaskCreated, TaskDeleted 이벤트
- Client-side event handlers

---

## Current Implementation Status

### ✅ Implemented (Story #50)

| Component | Location | Status |
|-----------|----------|--------|
| TaskHub | `Backend/Hubs/TaskHub.cs` | ✅ |
| SignalR Service Registration | `Backend/Program.cs` | ✅ |
| Hub Endpoint Mapping | `Backend/Program.cs` | ✅ |
| signalRService | `Frontend/services/signalRService.ts` | ✅ |
| BoardPage Connection | `Frontend/pages/BoardPage.tsx` | ✅ |
| CORS Configuration | `Backend/Program.cs` | ✅ |

### 🔜 Planned (Future Tasks)

| Component | Description | Task # |
|-----------|-------------|--------|
| NotificationService | Send events from services | TBD |
| Client Event Handlers | Receive and process events | TBD |
| Redux Integration | Update store on events | TBD |
| Reconnection Handling | UI feedback on disconnect | TBD |

---

## Configuration Reference

### Backend (Program.cs)

```csharp
// 1. Service Registration
builder.Services.AddSignalR();

// 2. CORS (Required for SignalR)
policy.AllowCredentials();  // Important!
policy.WithOrigins("http://localhost:5173");

// 3. Endpoint Mapping
app.MapHub<TaskHub>("/hubs/tasks");
```

### Frontend (signalRService.ts)

```typescript
// Hub URL
const HUB_URL = "https://localhost:5001/hubs/tasks";

// Connection Builder
new HubConnectionBuilder()
  .withUrl(HUB_URL, {
    accessTokenFactory: () => localStorage.getItem("token") || "",
  })
  .withAutomaticReconnect()
  .build();
```

---

## Network Requirements

| Requirement | Value | Notes |
|-------------|-------|-------|
| Protocol | HTTPS/WSS | Secure WebSocket |
| Port | 5001 | Backend server port |
| CORS | Enabled | Frontend origin allowed |
| Credentials | Required | JWT token in header |
| Firewall | Allow WSS | WebSocket upgrade allowed |

---

## Troubleshooting Guide

### Connection Issues

| Symptom | Possible Cause | Solution |
|---------|----------------|----------|
| 401 Unauthorized | Invalid/expired token | Check token in localStorage |
| CORS error | Origin not allowed | Add origin to CORS policy |
| Connection refused | Server not running | Start backend server |
| WebSocket failed | Proxy blocking | Check proxy/firewall settings |

### Debug Commands

**Browser Console:**
```javascript
// Check connection state
signalRService.getConnection().state

// Manual connect
await signalRService.start()

// Check token
localStorage.getItem("token")
```

**Backend Logs:**
```
SignalR connection established: {connectionId}
User joined TaskBoard group: {userId}
```

---

## Related Documentation

| Document | Path | Description |
|----------|------|-------------|
| Backend Hub | `learning-notes/backend/51-signalr-hub/` | TaskHub implementation |
| Frontend Client | `learning-notes/frontend/52-signalr-client/` | SignalR service |
| (Future) Notifications | TBD | Real-time event handling |

---

## Changelog

| Date | Task | Changes |
|------|------|---------|
| 2024-XX-XX | #51 | TaskHub created, Program.cs configured |
| 2024-XX-XX | #52 | signalRService.ts, BoardPage integration |
| | | (향후 추가 예정) |
