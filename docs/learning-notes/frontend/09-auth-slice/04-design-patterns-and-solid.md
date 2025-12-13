# authSlice - Design Patterns & SOLID Principles

## SOLID Principles Applied

### S - Single Responsibility Principle

Each file has **one reason to change**.

```mermaid
flowchart TB
    subgraph SRP["Single Responsibility Principle"]
        direction TB

        subgraph API["api.ts"]
            A["Changes when:<br/>• API server URL changes<br/>• Auth header method changes<br/>• Common error handling added"]
        end

        subgraph SERVICE["authService.ts"]
            S["Changes when:<br/>• Auth endpoints change<br/>• New auth method added (OAuth)<br/>• Request data format changes"]
        end

        subgraph SLICE["authSlice.ts"]
            SL["Changes when:<br/>• State structure changes<br/>• New action added (login)<br/>• State update logic changes"]
        end

        subgraph STORE["store.ts"]
            ST["Changes when:<br/>• New feature slice added<br/>• Middleware settings change"]
        end
    end
```

**Comparison:**

| File | Responsibility | Lines | Reason to Change |
|------|----------------|-------|------------------|
| `api.ts` | HTTP infrastructure | ~35 | Server settings change |
| `authService.ts` | Auth API calls | ~35 | Endpoint changes |
| `authSlice.ts` | Auth state management | ~115 | State logic changes |
| `store.ts` | Store configuration | ~40 | New slice added |

---

### O - Open/Closed Principle

**Open for extension, closed for modification.**

```mermaid
flowchart LR
    subgraph OCP["Open/Closed Principle"]
        direction TB

        subgraph ORIGINAL["Original authService"]
            O["register()"]
        end

        subgraph EXTENDED["Extended (without modification)"]
            E1["register()"]
            E2["+ login()"]
            E3["+ refreshToken()"]
            E4["+ logout()"]
        end

        ORIGINAL -->|"extend"| EXTENDED
    end
```

**Example: Adding new methods**

```typescript
// authService.ts - extend without modifying existing code
export const authService = {
  register: async (data: RegisterFormData) => { ... },  // existing

  // newly added (no changes to existing code)
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post<AuthResponse>("/auth/refresh");
    return response.data;
  },
};
```

**Extending authSlice:**

```typescript
// Add new thunk without modifying existing ones
export const login = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  // ...
});

// Add cases to extraReducers (no modification to existing cases)
.addCase(login.pending, ...)
.addCase(login.fulfilled, ...)
.addCase(login.rejected, ...)
```

---

### L - Liskov Substitution Principle

**Subtypes must be substitutable for their base types.**

```mermaid
flowchart TB
    subgraph LSP["Liskov Substitution Principle"]
        direction TB

        subgraph BASE["Base: Axios Instance"]
            B["api.get(), api.post(), api.put()"]
        end

        subgraph DERIVED["Derived: Configured Instance"]
            D["+ baseURL configured<br/>+ headers configured<br/>+ interceptor configured"]
        end

        subgraph USAGE["Usage"]
            U["authService, taskService, userService<br/>can all use it the same way"]
        end

        BASE --> DERIVED --> USAGE
    end
```

**Applied example:**

```typescript
// Can be used the same as base axios
import axios from "axios";
import api from "./services/api";

// Both have the same interface
axios.post("/auth/register", data);  // base
api.post("/auth/register", data);    // configured instance

// api behaves like a subtype of axios
// Can use api anywhere axios is expected
```

---

### I - Interface Segregation Principle

**Clients should not depend on interfaces they don't use.**

```mermaid
flowchart TB
    subgraph ISP["Interface Segregation Principle"]
        direction TB

        subgraph BAD["❌ One large type"]
            FAT["AuthState<br/>─────────────<br/>user<br/>token<br/>isAuthenticated<br/>loading<br/>error<br/>refreshToken<br/>expiresAt<br/>lastLogin<br/>..."]
        end

        subgraph GOOD["✅ Select only what's needed"]
            direction LR
            USER["User type<br/>─────────────<br/>id, name, email, role"]
            AUTH["AuthState<br/>─────────────<br/>user, token, loading, error"]
            RESPONSE["AuthResponse<br/>─────────────<br/>token, user, expiresIn"]
        end
    end
```

**Applied example:**

```typescript
// ✅ Segregated types
export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: "Admin" | "User";
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

// Each component imports only the types it needs
// RegisterPage: uses AuthState
// Header: only needs User type
```

---

### D - Dependency Inversion Principle

**High-level modules should not depend on low-level modules. Both should depend on abstractions.**

```mermaid
flowchart TB
    subgraph DIP["Dependency Inversion Principle"]
        direction TB

        subgraph HIGH["High-Level: authSlice"]
            SL["register thunk"]
        end

        subgraph ABSTRACTION["Abstraction: Interface"]
            INT["authService.register(data)<br/>─────────────<br/>Returns Promise<AuthResponse>"]
        end

        subgraph LOW["Low-Level: Implementations"]
            direction LR
            REAL["Real API call"]
            MOCK["Mock (for testing)"]
        end

        SL -->|"depends on"| INT
        REAL -->|"implements"| INT
        MOCK -->|"implements"| INT
    end
```

**Applied example:**

```typescript
// authSlice depends only on authService interface
export const register = createAsyncThunk(
  "auth/register",
  async (data: RegisterFormData, { rejectWithValue }) => {
    const response = await authService.register(data);  // depends on abstraction
    // ...
  }
);

// Can replace with mock during testing
const mockAuthService = {
  register: jest.fn().mockResolvedValue({ token: "test", user: {...} }),
};
```

---

## Design Patterns Applied

### 1. Flux / Redux Pattern

```mermaid
flowchart LR
    subgraph FLUX["Flux/Redux Pattern"]
        direction TB

        subgraph VIEW["View"]
            V["RegisterPage<br/>RegisterForm"]
        end

        subgraph ACTION["Action"]
            A["dispatch(register(data))"]
        end

        subgraph STORE["Store"]
            S["Redux Store<br/>─────────────<br/>Single Source of Truth"]
        end

        subgraph REDUCER["Reducer"]
            R["authSlice.reducer<br/>─────────────<br/>Pure Function"]
        end
    end

    V -->|"1. dispatch"| A
    A -->|"2. action"| S
    S -->|"3. calls"| R
    R -->|"4. new state"| S
    S -->|"5. notify"| V
```

**Three Principles of Redux:**

| Principle | Description | In Task #9 |
|-----------|-------------|------------|
| Single Source of Truth | Entire state in one store | `configureStore` |
| State is Read-Only | State changes only via actions | `dispatch(register(...))` |
| Changes with Pure Functions | Reducers are pure functions | `authSlice.reducer` |

---

### 2. Thunk Pattern (Middleware)

```mermaid
flowchart TB
    subgraph THUNK["Thunk Pattern"]
        direction TB

        subgraph WITHOUT["❌ Without Thunk"]
            W["dispatch({ type: 'SET_USER', user })<br/>─────────────<br/>Only sync actions possible"]
        end

        subgraph WITH["✅ With Thunk"]
            T["dispatch(register(data))<br/>─────────────<br/>Async logic possible<br/>Dispatch actions after API call"]
        end
    end

    WITHOUT -->|"extend"| WITH
```

**How Thunk middleware works:**

```mermaid
flowchart LR
    subgraph MIDDLEWARE["Thunk Middleware"]
        direction TB

        subgraph DISPATCH["dispatch(action)"]
            D["Action dispatched"]
        end

        subgraph CHECK["Type Check"]
            C{"Is action<br/>a function?"}
        end

        subgraph FUNCTION["If function"]
            F["Execute action(dispatch, getState)"]
        end

        subgraph OBJECT["If object"]
            O["Pass to next middleware"]
        end
    end

    D --> C
    C -->|"Yes"| F
    C -->|"No"| O
```

---

### 3. Provider Pattern (React Context)

```mermaid
flowchart TB
    subgraph PROVIDER["Provider Pattern"]
        direction TB

        subgraph CONTEXT["React Context"]
            Store["Redux Store"]
        end

        subgraph TREE["Component Tree"]
            Root["<Provider store={store}>"]
            App["App"]
            Page["RegisterPage"]
            Form["RegisterForm"]
        end

        subgraph CONSUMERS["Context Consumers"]
            UseSelector["useSelector()"]
            UseDispatch["useDispatch()"]
        end
    end

    Store --> Root
    Root --> App --> Page --> Form
    Form -.->|"consume"| UseSelector
    Form -.->|"consume"| UseDispatch
```

**Why Provider Pattern?**

| Approach | Code | Problem |
|----------|------|---------|
| Props Drilling | `<App store={store}>` → `<Page store={store}>` → ... | Intermediate components must pass props |
| Context (Provider) | `<Provider store={store}>` | Access from any depth |

---

### 4. Service Layer Pattern

```mermaid
flowchart TB
    subgraph SERVICE_LAYER["Service Layer Pattern"]
        direction TB

        subgraph PRESENTATION["Presentation Layer"]
            P["Components<br/>─────────────<br/>UI rendering"]
        end

        subgraph STATE["State Layer"]
            S["Redux<br/>─────────────<br/>State management"]
        end

        subgraph SERVICE["Service Layer"]
            SVC["authService<br/>─────────────<br/>Encapsulates API calls"]
        end

        subgraph DATA["Data Layer"]
            D["Backend API<br/>─────────────<br/>Actual data"]
        end
    end

    P --> S --> SVC --> D
```

**Benefits:**

| Benefit | Description |
|---------|-------------|
| Separation of Concerns | Each layer handles only its responsibility |
| Testability | Mock Service to test State layer independently |
| Reusability | Same API call reused in multiple places |
| Change Isolation | API changes only affect Service |

---

### 5. Interceptor Pattern

```mermaid
flowchart LR
    subgraph INTERCEPTOR["Interceptor Pattern"]
        direction TB

        subgraph REQUEST["Request Pipeline"]
            R1["Request created"]
            I1["Interceptor 1<br/>(Attach token)"]
            I2["Interceptor 2<br/>(Logging)"]
            R2["Request sent"]
        end

        subgraph RESPONSE["Response Pipeline"]
            S1["Response received"]
            I3["Interceptor 3<br/>(Error handling)"]
            S2["Response returned"]
        end
    end

    R1 --> I1 --> I2 --> R2
    S1 --> I3 --> S2
```

**Currently applied:**

```typescript
// Request Interceptor - Auto-attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Future: Response Interceptor - Auto logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);
```

---

### 6. Builder Pattern (extraReducers)

```mermaid
flowchart LR
    subgraph BUILDER["Builder Pattern"]
        direction TB

        subgraph CHAIN["Method Chaining"]
            B["builder"]
            C1[".addCase(pending, ...)"]
            C2[".addCase(fulfilled, ...)"]
            C3[".addCase(rejected, ...)"]
        end

        subgraph RESULT["Result"]
            R["Complete extraReducers"]
        end
    end

    B --> C1 --> C2 --> C3 --> R
```

**Code example:**

```typescript
extraReducers: (builder) => {
  builder
    .addCase(register.pending, (state) => {
      state.loading = true;
    })
    .addCase(register.fulfilled, (state, action) => {
      state.user = action.payload.user;
    })
    .addCase(register.rejected, (state, action) => {
      state.error = action.payload as string;
    });
  // Chaining improves readability + perfect type inference
}
```

---

## Anti-Patterns Avoided

### 1. God Object (Avoided)

```mermaid
flowchart LR
    subgraph AVOIDED["❌ God Object (Avoided)"]
        GOD["authManager.ts<br/>─────────────<br/>API calls +<br/>State management +<br/>localStorage +<br/>Error handling +<br/>Type definitions"]
    end

    subgraph APPLIED["✅ Separated (Applied)"]
        direction TB
        A1["types.ts"]
        A2["api.ts"]
        A3["authService.ts"]
        A4["authSlice.ts"]
        A5["store.ts"]
    end

    GOD -->|"separate"| APPLIED
```

### 2. Direct State Mutation (Avoided)

```typescript
// ❌ Bad: Direct state mutation
state.user = newUser;  // Forbidden without Immer

// ✅ Good: Redux Toolkit + Immer
// Looks like "direct mutation" in authSlice.ts but
// Immer internally converts to immutable update
state.user = action.payload.user;  // OK (thanks to Immer)
```

### 3. Callback Hell (Avoided)

```typescript
// ❌ Bad: Callback hell
api.post('/register', data)
  .then(response => {
    localStorage.setItem('token', response.token);
    dispatch({ type: 'SET_USER', user: response.user });
  })
  .catch(error => {
    dispatch({ type: 'SET_ERROR', error: error.message });
  });

// ✅ Good: async/await + createAsyncThunk
export const register = createAsyncThunk("auth/register", async (data) => {
  const response = await authService.register(data);
  localStorage.setItem("token", response.token);
  return response;
});
```

---

## Pattern Summary

| Pattern | Applied In | Purpose |
|---------|------------|---------|
| **Flux/Redux** | Overall state management | Predictable state changes |
| **Thunk** | Async actions | State update after API calls |
| **Provider** | main.tsx | Inject Store into entire app |
| **Service Layer** | authService | Encapsulate API calls |
| **Interceptor** | api.ts | Intercept requests/responses |
| **Builder** | extraReducers | Type-safe case addition |
| **SRP** | All files | Single responsibility |
| **DIP** | thunk → service | Depend on abstractions |
