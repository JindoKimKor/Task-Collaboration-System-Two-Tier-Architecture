# Design Patterns

## Patterns Used

### 1. Singleton Pattern

```mermaid
flowchart TB
    subgraph SINGLETON["Singleton (Module-level)"]
        Variable["let connection: HubConnection | null = null"]
        Getter["getConnection()<br/>───────────<br/>if (!connection) create<br/>return connection"]
    end

    subgraph USAGE["Usage"]
        Call1["signalRService.start()"]
        Call2["signalRService.joinBoard()"]
        Call3["signalRService.stop()"]
    end

    Call1 --> Getter
    Call2 --> Getter
    Call3 --> Getter
    Getter --> Variable
```

**Implementation:**
```typescript
let connection: HubConnection | null = null;

const getConnection = (): HubConnection => {
  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, { ... })
      .build();
  }
  return connection;
};
```

**Benefits:**
- Single connection per application
- Lazy initialization (created when needed)
- Module-level scope (no class needed)

---

### 2. Facade Pattern

```mermaid
flowchart TB
    subgraph FACADE["signalRService (Facade)"]
        Start["start()"]
        Stop["stop()"]
        Join["joinBoard()"]
        Leave["leaveBoard()"]
    end

    subgraph COMPLEX["Complex Subsystem"]
        Builder["HubConnectionBuilder"]
        Connection["HubConnection"]
        State["HubConnectionState"]
    end

    Start --> Connection
    Stop --> Connection
    Join --> Connection
    Leave --> Connection
    Connection --> Builder
    Connection --> State
```

**Why Facade?**
- Hides SignalR complexity from components
- Simple API: `start()`, `stop()`, `joinBoard()`, `leaveBoard()`
- Components don't need to know about HubConnectionBuilder, states, etc.

---

### 3. Service Layer Pattern

```mermaid
flowchart TB
    subgraph COMPONENT["Component Layer"]
        BoardPage["BoardPage.tsx"]
    end

    subgraph SERVICE["Service Layer"]
        SignalRService["signalRService.ts"]
        ApiService["api.ts"]
    end

    subgraph EXTERNAL["External"]
        Hub["SignalR Hub"]
        REST["REST API"]
    end

    BoardPage --> SignalRService
    BoardPage --> ApiService
    SignalRService --> Hub
    ApiService --> REST
```

**Benefits:**
- Separation of concerns
- Components focus on UI
- Services handle communication logic
- Easy to test and mock

---

### 4. Module Pattern (ES Modules)

```mermaid
flowchart TB
    subgraph MODULE["signalRService.ts Module"]
        Private["Private (not exported)<br/>───────────<br/>let connection<br/>const HUB_URL<br/>const getConnection"]
        Public["Public (exported)<br/>───────────<br/>signalRService object"]
    end

    subgraph CONSUMER["Consumer"]
        Import["import { signalRService }"]
    end

    Import --> Public
    Public --> Private
```

**Implementation:**
```typescript
// Private - not accessible outside
const HUB_URL = "...";
let connection: HubConnection | null = null;
const getConnection = () => { ... };

// Public - exported
export const signalRService = {
  getConnection,
  start,
  stop,
  joinBoard,
  leaveBoard,
};
```

---

## React Patterns

### 1. useEffect for Side Effects

```mermaid
flowchart TB
    subgraph EFFECT["useEffect Pattern"]
        Setup["Setup Function<br/>───────────<br/>Connect SignalR"]
        Cleanup["Cleanup Function<br/>───────────<br/>Disconnect SignalR"]
        Deps["Dependencies: []<br/>───────────<br/>Run once"]
    end

    Mount["Component Mount"] --> Setup
    Unmount["Component Unmount"] --> Cleanup
```

**Implementation:**
```typescript
useEffect(() => {
  // Setup
  const connectSignalR = async () => {
    await signalRService.start();
    await signalRService.joinBoard();
  };
  connectSignalR();

  // Cleanup
  return () => {
    const disconnectSignalR = async () => {
      await signalRService.leaveBoard();
      await signalRService.stop();
    };
    disconnectSignalR();
  };
}, []); // Empty deps = mount/unmount only
```

---

### 2. Async in useEffect

```mermaid
flowchart TB
    subgraph PROBLEM["❌ Problem"]
        Wrong["useEffect(async () => {...})<br/>───────────<br/>Not allowed"]
    end

    subgraph SOLUTION["✅ Solution"]
        Right["useEffect(() => {<br/>  const fn = async () => {...};<br/>  fn();<br/>})"]
    end

    PROBLEM -->|"fix"| SOLUTION
```

**Why?**
- useEffect callback can't be async directly
- Must define async function inside and call it
- Cleanup function must be sync

---

## Anti-Patterns Avoided

```mermaid
flowchart LR
    subgraph AVOID["❌ Anti-Patterns"]
        Global["Global connection variable<br/>in window object"]
        NoCleanup["No cleanup on unmount"]
        DirectImport["Direct HubConnection<br/>in components"]
    end

    subgraph USE["✅ Correct Patterns"]
        Module["Module-scoped singleton"]
        Cleanup["Proper cleanup function"]
        Service["Service abstraction"]
    end

    Global -->|"refactor"| Module
    NoCleanup -->|"add"| Cleanup
    DirectImport -->|"wrap in"| Service
```
