# Design Patterns

## Patterns Used

### 1. Barrel Export Pattern

```mermaid
flowchart TB
    subgraph WITHOUT["Without Barrel"]
        I1["import { userService } from './features/user/services/userService'"]
        I2["import type { UserListItemDto } from './features/user/types/api.types'"]
    end

    subgraph WITH["With Barrel (index.ts)"]
        I3["import { userService, UserListItemDto } from './features/user'"]
    end

    WITHOUT -->|"simplifies to"| WITH
```

**Implementation:**
```typescript
// features/user/index.ts
export { userService } from "./services/userService";
export type { UserListItemDto } from "./types/api.types";
```

**Benefits:**
- Cleaner imports
- Encapsulation of internal structure
- Single point of access
- Easy refactoring without changing consumers

---

### 2. Service Layer Pattern

```mermaid
flowchart TB
    subgraph COMPONENT["Component"]
        TaskForm["TaskForm<br/>───────────<br/>UI Logic"]
    end

    subgraph SERVICE["Service Layer"]
        UserService["userService<br/>───────────<br/>API calls"]
    end

    subgraph API["API Layer"]
        Axios["axios instance<br/>───────────<br/>HTTP client"]
    end

    TaskForm -->|"getAllUsers()"| UserService
    UserService -->|"api.get()"| Axios
```

**Why separate service?**
- Component doesn't know about HTTP
- Reusable across components
- Easy to mock for testing
- Single responsibility

---

### 3. Container/Presentational Pattern (준수)

```mermaid
flowchart TB
    subgraph PRESENTATIONAL["TaskForm (Presentational)"]
        direction TB
        Props["Props:<br/>───────────<br/>initialValues<br/>onSubmit<br/>onCancel<br/>isLoading"]
        LocalState["Local State:<br/>───────────<br/>Form fields<br/>Users list<br/>Validation"]
        UI["Renders:<br/>───────────<br/>Form UI only"]
    end

    subgraph CONTAINER["CreateTaskPage (Container)"]
        direction TB
        Redux["Redux:<br/>───────────<br/>dispatch(createTask)"]
        Navigation["Navigation:<br/>───────────<br/>useNavigate()"]
    end

    CONTAINER -->|"passes props"| PRESENTATIONAL
```

**Note:** TaskForm은 local state로 users를 관리 (Redux 불필요)
- 사용자 목록은 form 내부에서만 필요
- 다른 컴포넌트와 공유 불필요
- 심플한 fetch & display 패턴

---

### 4. Controlled Component Pattern

```mermaid
flowchart LR
    subgraph STATE["React State"]
        AssignedToId["assignedToId: number | null"]
    end

    subgraph SELECT["‹select› Element"]
        Value["value={assignedToId ?? ''}"]
        OnChange["onChange={(e) => setAssignedToId(...)}"]
    end

    STATE -->|"controls"| Value
    OnChange -->|"updates"| STATE
```

**Implementation:**
```typescript
<select
  value={assignedToId ?? ""}
  onChange={(e) =>
    setAssignedToId(e.target.value ? Number(e.target.value) : null)
  }
>
```

**Why controlled?**
- Single source of truth (React state)
- Easy to validate/transform values
- Predictable behavior

---

### 5. Loading State Pattern

```mermaid
flowchart TB
    subgraph LOADING_STATE["Loading State Management"]
        Initial["usersLoading = true<br/>───────────<br/>Dropdown disabled"]
        Loaded["usersLoading = false<br/>───────────<br/>Dropdown enabled"]
    end

    subgraph UI["UI Feedback"]
        Disabled["disabled={usersLoading}"]
        Message["Loading users..."]
    end

    Initial --> Disabled
    Initial --> Message
    Loaded --> UI
```

**Implementation:**
```typescript
const [usersLoading, setUsersLoading] = useState(true);

// In JSX
<select disabled={usersLoading}>
  ...
</select>
{usersLoading && <p>Loading users...</p>}
```

---

## SOLID Principles Applied

### S - Single Responsibility

```mermaid
flowchart TB
    subgraph SRP["Single Responsibility"]
        direction LR

        Service["userService<br/>───────────<br/>API 호출만"]

        Types["api.types.ts<br/>───────────<br/>타입 정의만"]

        TaskForm["TaskForm<br/>───────────<br/>UI 렌더링만"]
    end
```

---

### O - Open/Closed

```mermaid
flowchart TB
    subgraph OCP["Open/Closed"]
        UserService["userService<br/>───────────<br/>현재: getAllUsers()"]
        Extended["미래 확장<br/>───────────<br/>+ getUserById()<br/>+ searchUsers()"]
    end

    UserService -->|"extend without modify"| Extended
```

**How?** 새 메서드 추가는 기존 코드 변경 없이 가능

---

### D - Dependency Inversion

```mermaid
flowchart TB
    subgraph HIGH["High-Level (TaskForm)"]
        Component["Form Component"]
    end

    subgraph ABSTRACTION["Abstraction"]
        Service["userService object<br/>───────────<br/>getAllUsers(): Promise"]
    end

    subgraph LOW["Low-Level"]
        Axios["axios implementation"]
    end

    Component -->|"depends on"| Service
    Service -->|"uses internally"| Axios
```

**TaskForm은 axios를 직접 사용하지 않음** → Service를 통해 추상화

---

## Anti-Patterns Avoided

```mermaid
flowchart LR
    subgraph AVOID["❌ Anti-Patterns"]
        Direct["Component에서 직접 fetch"]
        Global["불필요한 Redux 사용"]
        NoLoading["로딩 상태 없음"]
    end

    subgraph USE["✅ Correct Patterns"]
        Service["Service Layer 사용"]
        Local["Local state로 충분"]
        Loading["Loading 상태 관리"]
    end

    Direct -->|"replace"| Service
    Global -->|"simplify"| Local
    NoLoading -->|"add"| Loading
```
