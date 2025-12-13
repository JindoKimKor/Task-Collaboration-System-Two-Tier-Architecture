# Architecture Diagram

## SignalR Client Overview

```mermaid
flowchart TB
    subgraph BROWSER["Browser"]
        direction TB
        BoardPage["BoardPage.tsx<br/>───────────<br/>Container Component"]
        Service["signalRService.ts<br/>───────────<br/>Singleton Connection"]
        SignalRLib["@microsoft/signalr<br/>───────────<br/>HubConnection"]
    end

    subgraph SERVER["Backend"]
        direction TB
        TaskHub["TaskHub<br/>───────────<br/>/hubs/tasks"]
    end

    BoardPage -->|"uses"| Service
    Service -->|"creates"| SignalRLib
    SignalRLib <-->|"WebSocket"| TaskHub
```

---

## Connection Lifecycle

```mermaid
sequenceDiagram
    participant BP as BoardPage
    participant SR as signalRService
    participant Hub as TaskHub (Server)

    Note over BP: Component mounts
    BP->>SR: start()
    SR->>Hub: WebSocket connect
    Hub-->>SR: Connected
    SR-->>BP: Connection ready

    BP->>SR: joinBoard()
    SR->>Hub: invoke("JoinBoard")
    Hub-->>SR: Joined group

    Note over BP: User views board...

    Note over BP: Component unmounts
    BP->>SR: leaveBoard()
    SR->>Hub: invoke("LeaveBoard")
    Hub-->>SR: Left group

    BP->>SR: stop()
    SR->>Hub: Close connection
    Hub-->>SR: Disconnected
```

---

## Service Layer Architecture

```mermaid
flowchart TB
    subgraph SERVICES["src/services/"]
        direction TB
        Api["api.ts<br/>───────────<br/>REST API (axios)<br/>Request/Response"]
        SignalR["signalRService.ts<br/>───────────<br/>Real-time (SignalR)<br/>Bi-directional"]
    end

    subgraph FEATURES["Features"]
        TaskFeature["task/<br/>───────────<br/>BoardPage<br/>TaskForm"]
    end

    TaskFeature -->|"HTTP calls"| Api
    TaskFeature -->|"Real-time"| SignalR
```

---

## Singleton Pattern

```mermaid
flowchart TB
    subgraph SINGLETON["Singleton Connection"]
        direction TB
        Module["signalRService.ts"]
        Connection["let connection: HubConnection | null"]
        GetConn["getConnection()<br/>───────────<br/>Create if null<br/>Return existing"]
    end

    subgraph CONSUMERS["Consumers"]
        BP1["BoardPage (Tab 1)"]
        BP2["BoardPage (Tab 2)"]
    end

    BP1 -->|"getConnection()"| GetConn
    BP2 -->|"getConnection()"| GetConn
    GetConn -->|"same instance"| Connection
```

**Why Singleton?**
- Single WebSocket connection per browser tab
- Avoid duplicate connections
- Efficient resource usage
- Consistent state management

---

## useEffect Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Mounting: Component renders

    Mounting --> Connecting: useEffect runs
    Connecting --> Connected: start() success
    Connected --> JoinedGroup: joinBoard() success

    JoinedGroup --> JoinedGroup: User interaction

    JoinedGroup --> LeavingGroup: Component unmounts
    LeavingGroup --> Disconnecting: leaveBoard()
    Disconnecting --> Disconnected: stop()
    Disconnected --> [*]
```

---

## Error Handling Flow

```mermaid
flowchart TB
    subgraph CONNECT["Connection Phase"]
        Start["start()"]
        StartErr["catch: console.error"]
    end

    subgraph JOIN["Join Phase"]
        Join["joinBoard()"]
        JoinErr["catch: console.error"]
    end

    subgraph CLEANUP["Cleanup Phase"]
        Leave["leaveBoard()"]
        Stop["stop()"]
        CleanupErr["catch: console.error"]
    end

    Start -->|"success"| Join
    Start -->|"error"| StartErr
    Join -->|"success"| Active["Active Connection"]
    Join -->|"error"| JoinErr
    Active --> Leave
    Leave --> Stop
    Leave -->|"error"| CleanupErr
    Stop -->|"error"| CleanupErr
```

---

## Transport Fallback

```mermaid
flowchart LR
    subgraph TRANSPORTS["SignalR Transports"]
        WS["WebSocket<br/>───────────<br/>Preferred"]
        SSE["Server-Sent Events<br/>───────────<br/>Fallback 1"]
        LP["Long Polling<br/>───────────<br/>Fallback 2"]
    end

    Client["Browser"] -->|"Try first"| WS
    WS -->|"Not available"| SSE
    SSE -->|"Not available"| LP
```

**SignalR automatically handles transport negotiation**
