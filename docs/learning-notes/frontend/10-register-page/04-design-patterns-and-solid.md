# Design Patterns and SOLID Principles - Task #10

## Overview

This document analyzes the design patterns and SOLID principles applied in Task #10 (RegisterPage implementation).

---

## Design Patterns Applied

### 1. Container/Presentational Pattern

**Definition:** Separates components into two categories:
- **Container**: Handles data fetching, state management, business logic
- **Presentational**: Handles UI rendering, receives data via props

**Application in Task #10:**

```mermaid
flowchart TB
    subgraph CONTAINER["Container: RegisterPage.tsx"]
        C1["useAppSelector()<br/>reads Redux state"]
        C2["useAppDispatch()<br/>dispatches actions"]
        C3["useNavigate()<br/>handles navigation"]
        C4["useEffect()<br/>handles side effects"]
    end

    subgraph PROPS["Props Interface"]
        P1["onSubmit: (data) => void"]
        P2["loading: boolean"]
        P3["error: string | null"]
    end

    subgraph PRESENTATIONAL["Presentational: RegisterForm.tsx"]
        PR1["Receives props only"]
        PR2["Renders form fields"]
        PR3["No Redux awareness"]
        PR4["No Router awareness"]
    end

    CONTAINER -->|"passes"| PROPS
    PROPS --> PRESENTATIONAL
```

**Benefits:**
| Benefit | Description |
|---------|-------------|
| Testability | Presentational components can be tested with props only |
| Reusability | RegisterForm can be reused in different contexts |
| Separation of Concerns | UI logic separated from business logic |
| Maintainability | Changes to UI don't affect business logic and vice versa |

---

### 2. Provider Pattern

**Definition:** Makes data/functionality available to all descendant components without prop drilling.

**Application in Task #10:**

```mermaid
flowchart TB
    subgraph MAIN["main.tsx"]
        Provider["Provider store={store}<br/>─────────────<br/>Redux Provider"]
    end

    subgraph APP["App.tsx"]
        App["App Component"]
    end

    subgraph ROUTER["AppRouter.tsx"]
        BrowserRouter["BrowserRouter<br/>─────────────<br/>Router Provider"]
        Routes["Routes"]
    end

    subgraph PAGE["RegisterPage.tsx"]
        useAppSelector["useAppSelector()<br/>← Consumes Redux"]
        useNavigate["useNavigate()<br/>← Consumes Router"]
    end

    Provider --> App
    App --> BrowserRouter
    BrowserRouter --> Routes
    Routes --> PAGE
```

**Why Multiple Providers?**
| Provider | Provides | Consumed By |
|----------|----------|-------------|
| Redux Provider | store (state, dispatch) | useAppSelector, useAppDispatch |
| BrowserRouter | location, navigate | useNavigate, useLocation |

---

### 3. Custom Hook Pattern

**Definition:** Extracts reusable stateful logic into custom hooks.

**Application in Task #10:**

```mermaid
flowchart LR
    subgraph STORE["store.ts"]
        RootState["RootState"]
        AppDispatch["AppDispatch"]
    end

    subgraph HOOKS["hooks.ts (Custom Hooks)"]
        useAppSelector["useAppSelector<br/>─────────────<br/>TypedUseSelectorHook"]
        useAppDispatch["useAppDispatch<br/>─────────────<br/>() => AppDispatch"]
    end

    subgraph COMPONENT["RegisterPage.tsx"]
        usage["Type-safe Redux access<br/>─────────────<br/>No explicit type annotations"]
    end

    RootState --> useAppSelector
    AppDispatch --> useAppDispatch
    useAppSelector --> usage
    useAppDispatch --> usage
```

**Before Custom Hooks:**
```typescript
// Every component needs explicit types
const dispatch = useDispatch<AppDispatch>();
const state = useSelector((state: RootState) => state.auth);
```

**After Custom Hooks:**
```typescript
// Types are pre-applied
const dispatch = useAppDispatch();
const state = useAppSelector(state => state.auth);
```

---

### 4. Declarative Routing Pattern

**Definition:** Define routes as data/configuration rather than imperative navigation code.

**Application in Task #10:**

```mermaid
flowchart TB
    subgraph DECLARATIVE["Declarative Routes (AppRouter.tsx)"]
        Routes["<Routes>"]
        R1["Route path='/'"]
        R2["Route path='/register'"]
        R3["Route path='/login' (future)"]
    end

    subgraph PAGES["Page Components"]
        Home["HomePage"]
        Register["RegisterPage"]
        Login["LoginPage (future)"]
    end

    Routes --> R1 --> Home
    Routes --> R2 --> Register
    Routes --> R3 --> Login
```

**Declarative vs Imperative:**
| Aspect | Declarative (react-router) | Imperative |
|--------|---------------------------|------------|
| Definition | "What routes exist" | "How to navigate" |
| Readability | Routes visible at a glance | Logic scattered |
| Maintenance | Add/remove Route components | Modify navigation logic |

---

### 5. Facade Pattern (Simplified Interface)

**Definition:** Provides a simplified interface to a complex subsystem.

**Application in Task #10:**

```mermaid
flowchart TB
    subgraph COMPONENT["Component Layer"]
        dispatch["dispatch(register(data))<br/>─────────────<br/>Simple interface"]
    end

    subgraph SLICE["Slice Layer"]
        thunk["createAsyncThunk<br/>─────────────<br/>pending/fulfilled/rejected"]
    end

    subgraph SERVICE["Service Layer"]
        authService["authService.register()<br/>─────────────<br/>HTTP call"]
    end

    subgraph INFRA["Infrastructure Layer"]
        axios["axios instance<br/>─────────────<br/>interceptors, baseURL"]
    end

    dispatch --> thunk
    thunk --> authService
    authService --> axios
```

---

## SOLID Principles Applied

### S - Single Responsibility Principle

**Definition:** A class/module should have only one reason to change.

**Application:**

```mermaid
flowchart LR
    subgraph FILES["Task #10 Files"]
        RP["RegisterPage.tsx<br/>─────────────<br/>Redux + Router 연결"]
        AR["AppRouter.tsx<br/>─────────────<br/>라우트 정의"]
        H["hooks.ts<br/>─────────────<br/>Typed hooks"]
        A["App.tsx<br/>─────────────<br/>Root 컴포넌트"]
    end
```

| File | Single Responsibility | Changes When |
|------|----------------------|--------------|
| `RegisterPage.tsx` | Connect Form to Redux, handle navigation | Navigation logic changes |
| `RegisterForm.tsx` | Render registration form UI | Form UI/UX changes |
| `AppRouter.tsx` | Define app routes | New pages added |
| `hooks.ts` | Provide typed Redux hooks | Store types change |
| `App.tsx` | Render root component | App structure changes |

---

### O - Open/Closed Principle

**Definition:** Open for extension, closed for modification.

**Application:**

```mermaid
flowchart TB
    subgraph EXISTING["Existing Routes (Closed)"]
        R1["Route /register"]
        R2["Route /"]
    end

    subgraph EXTENSION["Extensions (Open)"]
        R3["Route /login"]
        R4["Route /board"]
        R5["Route /profile"]
    end

    Routes["<Routes>"] --> EXISTING
    Routes --> EXTENSION
```

```typescript
// Adding LoginPage - no modification to existing code
<Routes>
  <Route path="/register" element={<RegisterPage />} />  // existing
  <Route path="/login" element={<LoginPage />} />        // extension
  <Route path="/board" element={<BoardPage />} />        // extension
</Routes>
```

---

### L - Liskov Substitution Principle

**Definition:** Subtypes must be substitutable for their base types.

**Application:**

```mermaid
flowchart TB
    subgraph INTERFACE["RegisterFormProps Interface"]
        I["onSubmit: (data) => void<br/>loading?: boolean<br/>error?: string | null"]
    end

    subgraph IMPLEMENTATIONS["Substitutable Implementations"]
        RF1["RegisterForm"]
        RF2["FancyRegisterForm"]
        RF3["MinimalRegisterForm"]
    end

    I --> RF1
    I --> RF2
    I --> RF3
```

Any component implementing `RegisterFormProps` can replace `RegisterForm`.

---

### I - Interface Segregation Principle

**Definition:** Clients should not depend on interfaces they don't use.

**Application:**

```mermaid
flowchart LR
    subgraph FULL_STATE["Full AuthState"]
        user["user"]
        token["token"]
        isAuthenticated["isAuthenticated"]
        loading["loading"]
        error["error"]
    end

    subgraph CONTAINER["RegisterPage uses"]
        C_loading["loading"]
        C_error["error"]
        C_isAuth["isAuthenticated"]
    end

    subgraph PRESENTATIONAL["RegisterForm receives"]
        P_loading["loading"]
        P_error["error"]
    end

    FULL_STATE --> CONTAINER
    CONTAINER -->|"only needed props"| PRESENTATIONAL
```

```typescript
// RegisterForm only receives what it needs
interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;
  loading?: boolean;
  error?: string | null;
  // Does NOT include: user, token, isAuthenticated
}
```

---

### D - Dependency Inversion Principle

**Definition:** High-level modules should not depend on low-level modules. Both should depend on abstractions.

**Application:**

```mermaid
flowchart TB
    subgraph HIGH["High-level: RegisterPage"]
        RP["RegisterPage Component"]
    end

    subgraph ABSTRACTION["Abstraction: Interface"]
        Props["RegisterFormProps<br/>─────────────<br/>onSubmit<br/>loading<br/>error"]
    end

    subgraph LOW["Low-level: Implementations"]
        RF["RegisterForm"]
        FRF["FancyRegisterForm"]
        MRF["MinimalRegisterForm"]
    end

    RP -->|"depends on"| Props
    RF -->|"implements"| Props
    FRF -->|"implements"| Props
    MRF -->|"implements"| Props
```

---

## Anti-Patterns Avoided

### 1. Prop Drilling (Avoided)

```mermaid
flowchart TB
    subgraph AVOIDED["❌ Prop Drilling (Avoided)"]
        A1["App"] -->|"user"| A2["Layout"]
        A2 -->|"user"| A3["Header"]
        A3 -->|"user"| A4["UserInfo"]
    end

    subgraph APPLIED["✅ Context/Redux (Applied)"]
        B1["App"]
        B2["Layout"]
        B3["Header"]
        B4["UserInfo<br/>useAppSelector()"]
    end
```

### 2. God Component (Avoided)

```mermaid
flowchart TB
    subgraph AVOIDED["❌ God Component (Avoided)"]
        God["RegisterPage<br/>─────────────<br/>validation<br/>API call<br/>state management<br/>UI rendering<br/>navigation"]
    end

    subgraph APPLIED["✅ Separated (Applied)"]
        RP["RegisterPage<br/>connection + navigation"]
        RF["RegisterForm<br/>UI rendering"]
        URF["useRegisterForm<br/>form state"]
        V["validation.ts<br/>validation rules"]
        AS["authSlice<br/>Redux state"]
    end
```

### 3. Hardcoded Dependencies (Avoided)

```mermaid
flowchart LR
    subgraph AVOIDED["❌ Hardcoded (Avoided)"]
        RF1["RegisterForm"]
        Redux1["Redux dispatch"]
        RF1 -->|"직접 호출"| Redux1
    end

    subgraph APPLIED["✅ Injected (Applied)"]
        RP2["RegisterPage"]
        RF2["RegisterForm"]
        Redux2["Redux dispatch"]
        RP2 -->|"dispatch"| Redux2
        RP2 -->|"onSubmit prop"| RF2
    end
```

---

## Summary

| Pattern/Principle | Application | Benefit |
|------------------|-------------|---------|
| Container/Presentational | RegisterPage / RegisterForm | Separation of concerns |
| Provider | Redux + Router | No prop drilling |
| Custom Hook | useAppDispatch, useAppSelector | Type safety, DRY |
| Declarative Routing | AppRouter Routes | Readability |
| SRP | Each file has one responsibility | Maintainability |
| OCP | Route definitions extensible | Easy to add features |
| ISP | RegisterFormProps minimal | Loose coupling |
| DIP | Props interface abstraction | Testability |

---

## Related Documentation

- [01-architecture-diagram.md](./01-architecture-diagram.md) - Architecture overview
- [02-container-pattern.md](./02-container-pattern.md) - Container pattern details
- [03-routing-layer.md](./03-routing-layer.md) - Routing implementation
- [05-programming-concepts.md](./05-programming-concepts.md) - Programming concepts
