# Design Patterns & SOLID (GoF-based)

## GoF Design Patterns Used

### 1. Facade Pattern

**GoF Definition:** Provide a unified interface to a set of interfaces in a subsystem.

**우리 코드에서:**
```
LoginPage = Facade
- Redux, Router, Form 복잡성을 숨김
- 단순한 페이지 인터페이스 제공
```

**Structure:**

```mermaid
flowchart TB
    subgraph Client["User"]
        U[Browser]
    end

    subgraph Facade["LoginPage (Facade)"]
        LP[LoginPage]
    end

    subgraph Subsystems["Complex Subsystems"]
        RX[Redux Store]
        RT[React Router]
        LF[LoginForm]
        TH[Thunks]
    end

    U -->|"/login"| LP
    LP --> RX
    LP --> RT
    LP --> LF
    LP --> TH
```

---

### 2. Mediator Pattern

**GoF Definition:** Define an object that encapsulates how a set of objects interact.

**우리 코드에서:**
```
LoginPage = Mediator (Local)
- LoginForm과 Redux 사이를 중재
- 직접 통신하지 않고 LoginPage를 통해
```

**Structure:**

```mermaid
flowchart TB
    subgraph Mediator["LoginPage (Mediator)"]
        LP[LoginPage]
    end

    subgraph Colleagues
        LF[LoginForm]
        RX[Redux]
        NV[Navigate]
    end

    LF -->|"onSubmit"| LP
    LP -->|"dispatch"| RX
    RX -->|"isAuthenticated"| LP
    LP -->|"navigate"| NV
```

**Without Mediator:**
```mermaid
flowchart LR
    LF[LoginForm] -->|"직접 dispatch"| RX[Redux]
    LF -->|"직접 navigate"| NV[Navigate]
```

**With Mediator:**
```mermaid
flowchart TB
    LF[LoginForm] -->|"onSubmit(data)"| LP[LoginPage]
    LP -->|"dispatch(login)"| RX[Redux]
    LP -->|"navigate(/board)"| NV[Navigate]
```

---

### 3. Observer Pattern

**GoF Definition:** Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified.

**우리 코드에서:**
```
useAppSelector = Observer subscription
- LoginPage가 Redux 상태를 구독
- 상태 변경 시 자동으로 알림받음
```

**Structure:**

```mermaid
flowchart TB
    subgraph Subject["Redux Store"]
        AS[AuthState]
    end

    subgraph Observers["Subscribers"]
        LP[LoginPage]
        RP[RegisterPage]
        HD[Header]
    end

    AS -->|"notify"| LP
    AS -->|"notify"| RP
    AS -->|"notify"| HD
```

**useEffect as Observer:**
```mermaid
sequenceDiagram
    participant R as Redux
    participant LP as LoginPage
    participant UE as useEffect

    R->>LP: isAuthenticated = true
    LP->>UE: Dependency changed
    UE->>UE: Execute callback
    UE->>LP: navigate("/board")
```

---

### 4. Template Method Pattern

**GoF Definition:** Define the skeleton of an algorithm in an operation, deferring some steps to subclasses.

**우리 코드에서:**
```
LoginPage와 RegisterPage = 같은 템플릿
- 동일한 구조, 다른 세부 구현
```

**Structure:**

```mermaid
flowchart LR
    subgraph Template["Page Template (공통 구조)"]
        direction TB
        T1["1. useAppDispatch()"]
        T2["2. useAppSelector()"]
        T3["3. useEffect (redirect)"]
        T4["4. handleSubmit"]
        T5["5. return JSX"]
        T1 --> T2 --> T3 --> T4 --> T5
    end

    Template -->|"구현"| Implementations

    subgraph Implementations["Concrete Implementations"]
        direction TB
        subgraph RegisterPage["RegisterPage"]
            R1["dispatch"] --- R2["{ loading, error, isAuthenticated }"] --- R3["navigate('/board')"] --- R4["dispatch(register(data))"] --- R5["&lt;RegisterForm /&gt;"]
        end

        subgraph LoginPage["LoginPage"]
            L1["dispatch"] --- L2["{ loading, error, isAuthenticated }"] --- L3["navigate('/board')"] --- L4["dispatch(login(data))"] --- L5["&lt;LoginForm /&gt;"]
        end

        RegisterPage ~~~ LoginPage
    end
```

**Step-by-Step Comparison:**

| Step | Template | LoginPage | RegisterPage |
|------|----------|-----------|--------------|
| 1 | useAppDispatch() | dispatch | dispatch |
| 2 | useAppSelector() | { loading, error, isAuthenticated } | { loading, error, isAuthenticated } |
| 3 | useEffect (redirect) | navigate('/board') | navigate('/board') |
| 4 | handleSubmit | dispatch(login(data)) | dispatch(register(data)) |
| 5 | return JSX | \<LoginForm /\> | \<RegisterForm /\> |

---

## SOLID Principles Applied

### S - Single Responsibility Principle

**적용:**

| Component | 단일 책임 |
|-----------|----------|
| LoginPage | Redux-Form 연결, Navigation |
| LoginForm | 로그인 UI 렌더링 |
| useLoginForm | 폼 상태 관리 |
| authThunks | API 호출 |

**Diagram:**

```mermaid
flowchart LR
    subgraph SRP["Single Responsibility"]
        LP["LoginPage<br/>───────<br/>• 상태 연결<br/>• 네비게이션"]
        LF["LoginForm<br/>───────<br/>• UI 렌더링"]
        UL["useLoginForm<br/>───────<br/>• 폼 상태"]
        AT["authThunks<br/>───────<br/>• API 호출"]
    end
```

---

### O - Open/Closed Principle

**적용:**

```mermaid
flowchart TB
    subgraph Closed["기존 코드 (수정 불필요)"]
        LP[LoginPage]
        LF[LoginForm]
    end

    subgraph Open["확장 가능"]
        FP[ForgotPasswordPage]
        TFA[TwoFactorPage]
    end

    FP -.->|"같은 패턴으로 추가"| LP
    TFA -.->|"같은 패턴으로 추가"| LP
```

---

### D - Dependency Inversion Principle

**적용:**

```mermaid
flowchart TB
    subgraph HighLevel["High Level Module"]
        LP[LoginPage]
    end

    subgraph Abstraction["Abstraction"]
        Props["LoginFormProps"]
        Hook["useAppDispatch"]
    end

    subgraph LowLevel["Low Level Module"]
        LF[LoginForm]
        RX[Redux Store]
    end

    LP -->|"의존"| Props
    LP -->|"의존"| Hook
    LF -.->|"구현"| Props
    RX -.->|"구현"| Hook
```

---

## Summary

| GoF Pattern | Where Applied | Purpose |
|-------------|---------------|---------|
| Facade | LoginPage | 복잡한 서브시스템 단순화 |
| Mediator | LoginPage | Form-Redux 통신 중재 |
| Observer | useAppSelector | 상태 변경 구독 |
| Template Method | Page structure | 동일 패턴, 다른 구현 |

| SOLID | Application |
|-------|-------------|
| SRP | 각 컴포넌트가 하나의 책임 |
| OCP | 새 Page 추가 시 기존 코드 변경 없음 |
| DIP | Props와 Hooks 추상화에 의존 |
