# Architecture Diagram

## Feature Structure

```mermaid
flowchart TB
    subgraph USER_FEATURE["features/user/ (NEW)"]
        direction TB
        Types["types/<br/>───────────<br/>api.types.ts"]
        Services["services/<br/>───────────<br/>userService.ts"]
        Index["index.ts<br/>───────────<br/>Barrel export"]
    end

    subgraph TASK_FEATURE["features/task/ (EXISTING)"]
        direction TB
        TaskForm["components/<br/>───────────<br/>TaskForm.tsx"]
    end

    Types --> Services
    Services --> Index
    Index --> TaskForm
```

---

## Component Data Flow

```mermaid
flowchart TB
    subgraph TASKFORM["TaskForm Component"]
        direction TB

        State["State<br/>───────────<br/>users: UserListItemDto[]<br/>usersLoading: boolean<br/>assignedToId: number | null"]

        Effect["useEffect<br/>───────────<br/>Load users on mount"]

        UI["Dropdown UI<br/>───────────<br/>‹select› with options"]
    end

    subgraph SERVICE["userService"]
        GetAll["getAllUsers()<br/>───────────<br/>GET /api/users"]
    end

    subgraph BACKEND["Backend"]
        Controller["UsersController<br/>───────────<br/>GetUsers()"]
        UserService["UserService<br/>───────────<br/>GetAllUsersAsync()"]
    end

    Effect -->|"calls"| GetAll
    GetAll -->|"HTTP"| Controller
    Controller --> UserService
    UserService -->|"response"| GetAll
    GetAll -->|"setUsers"| State
    State -->|"renders"| UI
```

---

## Import Graph

```mermaid
flowchart LR
    subgraph IMPORTS["TaskForm.tsx Imports"]
        direction TB
        React["react<br/>───────────<br/>useState, useEffect"]
        TaskTypes["../types/api.types<br/>───────────<br/>TaskStatus"]
        UserFeature["../../user<br/>───────────<br/>userService<br/>UserListItemDto"]
    end

    TaskForm["TaskForm.tsx"] --> React
    TaskForm --> TaskTypes
    TaskForm --> UserFeature
```

---

## Barrel Export Pattern

```mermaid
flowchart TB
    subgraph INTERNAL["Internal Files"]
        ApiTypes["types/api.types.ts<br/>───────────<br/>export interface UserListItemDto"]
        Service["services/userService.ts<br/>───────────<br/>export const userService"]
    end

    subgraph BARREL["index.ts (Barrel)"]
        Exports["export { userService }<br/>export type { UserListItemDto }"]
    end

    subgraph CONSUMER["Consumer"]
        TaskForm["import { userService } from '../../user'"]
    end

    ApiTypes --> BARREL
    Service --> BARREL
    BARREL --> TaskForm
```

**Why Barrel Export?**
- Clean import paths
- Hide internal structure
- Single entry point for feature
- Easy refactoring

---

## State Management

```mermaid
stateDiagram-v2
    [*] --> Initial: Component mounts

    Initial: users = []
    Initial: usersLoading = true

    Initial --> Loading: useEffect triggers

    Loading: Fetching users...
    Loading: Dropdown disabled

    Loading --> Success: API success
    Loading --> Error: API error

    Success: users = [...]
    Success: usersLoading = false
    Success: Dropdown enabled

    Error: users = []
    Error: usersLoading = false
    Error: Console error logged
```

---

## Dropdown Interaction

```mermaid
sequenceDiagram
    participant U as User
    participant D as Dropdown
    participant S as State
    participant F as Form Submit

    Note over D: Initial: "Unassigned" selected

    U->>D: Click dropdown
    D->>D: Show options (Unassigned + users)
    U->>D: Select "John Doe (JD)"
    D->>S: setAssignedToId(1)
    S->>D: Re-render with selected value

    U->>F: Click "Create Task"
    F->>F: Include assignedToId: 1 in payload
```
