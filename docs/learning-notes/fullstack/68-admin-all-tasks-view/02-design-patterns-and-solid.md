# Design Patterns and SOLID Principles

## Design Patterns

### 1. Guard Pattern (Route Guard)

```mermaid
flowchart TB
    subgraph GUARD["Guard Pattern"]
        Request["페이지 접근 요청"]
        Check{조건 확인}
        Allow["정상 렌더링"]
        Deny["리다이렉트"]
    end

    Request --> Check
    Check -->|통과| Allow
    Check -->|실패| Deny
```

**구현:**

```typescript
// AdminTasksPage.tsx
if (user?.role !== "Admin") {
  return <Navigate to="/board" replace />;
}
```

**Why Guard Pattern?**
- 권한 없는 사용자의 접근을 조기에 차단
- 불필요한 데이터 로딩 방지
- 사용자에게 명확한 피드백 (리다이렉트)

---

### 2. Conditional Rendering Pattern

```mermaid
flowchart LR
    subgraph CONDITION["조건부 렌더링"]
        C{조건}
        R1["컴포넌트 A"]
        R2["null"]
    end

    C -->|true| R1
    C -->|false| R2
```

**구현:**

```typescript
// Navigation 메뉴에서
{user?.role === "Admin" && (
  <AdminButton />
)}
```

**패턴 비교:**

| 패턴 | 구문 | 사용 시점 |
|------|------|----------|
| `&&` | `condition && <Comp />` | 조건 true일 때만 렌더링 |
| 삼항 | `cond ? <A /> : <B />` | 둘 중 하나 선택 |
| `if` | 일반 if문 | 복잡한 분기 |

---

### 3. Container Pattern (Local State)

```mermaid
flowchart TB
    subgraph CONTAINER["AdminTasksPage (Container)"]
        State["useState: tasks, filters, loading"]
        Fetch["API 호출 로직"]
        Render["UI 렌더링"]
    end

    subgraph DIFFERS["KanbanBoard vs AdminTable"]
        KB["KanbanBoard<br/>Redux 사용"]
        AT["AdminTasksPage<br/>Local State 사용"]
    end

    State --> Fetch
    Fetch --> Render
```

**Why Local State?**
- Admin 페이지는 독립적인 필터 상태 필요
- 다른 페이지와 상태 공유 불필요
- 컴포넌트 언마운트 시 상태 자동 초기화

---

### 4. Filter Object Pattern

```mermaid
flowchart LR
    subgraph FILTERS["단일 필터 객체"]
        F["filters: {<br/>  status,<br/>  assignedTo,<br/>  search,<br/>  includeArchived<br/>}"]
    end

    subgraph UPDATES["일관된 업데이트"]
        U["setFilters(prev => ({<br/>  ...prev,<br/>  status: newValue<br/>}))"]
    end

    F --> U
```

**구현:**

```typescript
const [filters, setFilters] = useState({
  status: "",
  assignedTo: "",
  search: "",
  includeArchived: false,
});

// 필터 업데이트
const handleFilterChange = (key: string, value: any) => {
  setFilters(prev => ({ ...prev, [key]: value }));
};
```

**Benefits:**
- 관련 상태를 하나의 객체로 그룹화
- 코드 가독성 향상
- 상태 업데이트 일관성

---

## SOLID Principles

### S - Single Responsibility Principle

```mermaid
flowchart TB
    subgraph SRP["단일 책임"]
        BP["BoardPage<br/>───────────<br/>Kanban 뷰"]
        AP["AdminTasksPage<br/>───────────<br/>Admin 테이블 뷰"]
        TC["TasksController<br/>───────────<br/>API + 권한 검증"]
    end
```

| 컴포넌트 | 책임 |
|----------|------|
| BoardPage | 일반 사용자 Kanban 뷰 |
| AdminTasksPage | Admin 전용 테이블 뷰 |
| TasksController | API 엔드포인트 + 권한 검증 |

---

### O - Open/Closed Principle

```mermaid
flowchart TB
    subgraph OPEN["확장에 열림"]
        Nav["Navigation Tabs"]
    end

    subgraph TABS["탭 추가"]
        T1["All Tasks"]
        T2["My Tasks"]
        T3["Assigned to Me"]
        T4["All Tasks (Admin)"]
    end

    Nav --> T1
    Nav --> T2
    Nav --> T3
    Nav -.->|"조건부"| T4
```

**확장 방법:**
```typescript
// 새 탭 추가 시 기존 코드 수정 최소화
{user?.role === "Admin" && (
  <button>All Tasks (Admin)</button>
)}
```

---

### D - Dependency Inversion Principle

```mermaid
flowchart TB
    subgraph HIGH["High-Level (Frontend)"]
        Page["AdminTasksPage"]
    end

    subgraph ABSTRACTION["Abstraction"]
        API["taskService.getTasks()"]
    end

    subgraph LOW["Low-Level (Backend)"]
        Controller["TasksController"]
    end

    Page -->|"depends on"| API
    API -->|"calls"| Controller
```

**Frontend는 API 인터페이스에만 의존:**
```typescript
// AdminTasksPage.tsx
const response = await taskService.getTasks({
  ...filters,
  includeArchived: filters.includeArchived,
});
```

---

## 핵심 요약

| 패턴 | 적용 위치 | 목적 |
|------|----------|------|
| Guard Pattern | AdminTasksPage | 권한 없으면 리다이렉트 |
| Conditional Rendering | Navigation | Admin에게만 메뉴 표시 |
| Container Pattern | AdminTasksPage | 로컬 상태로 필터 관리 |
| Filter Object Pattern | filters state | 관련 상태 그룹화 |
