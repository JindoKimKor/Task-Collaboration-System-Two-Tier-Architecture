# authSlice - Architecture Diagram

## File Structure

```
src/
├── app/
│   └── store.ts                    ← Redux store configuration
├── services/
│   └── api.ts                      ← Axios instance (shared)
├── features/auth/
│   ├── services/
│   │   └── authService.ts          ← Auth API calls
│   ├── store/
│   │   └── authSlice.ts            ← Redux slice + thunks
│   ├── types.ts                    ← + User, AuthState types
│   └── index.ts                    ← + exports
└── main.tsx                        ← + Provider wrapper
```

---

## Redux Architecture Overview

```mermaid
flowchart TB
    subgraph APP["Application"]
        direction TB

        subgraph MAIN["main.tsx"]
            Provider["<Provider store={store}>"]
        end

        subgraph STORE["app/store.ts"]
            ConfigStore["configureStore()"]
            AuthReducer["auth: authReducer"]
        end

        subgraph SLICE["features/auth/store/authSlice.ts"]
            Thunk["registerThunk"]
            Reducer["authReducer"]
            Actions["Actions: clearError, logout"]
        end

        subgraph SERVICE["features/auth/services/authService.ts"]
            Register["register(data)"]
        end

        subgraph API["services/api.ts"]
            Axios["axios instance"]
            Interceptor["request interceptor"]
        end
    end

    Provider --> ConfigStore
    ConfigStore --> AuthReducer
    AuthReducer --> Reducer
    Thunk --> Register
    Register --> Axios
    Interceptor --> Axios
```

---

## Redux Data Flow

```mermaid
flowchart LR
    subgraph COMPONENT["React Component"]
        Dispatch["dispatch(register(data))"]
        Select["useSelector(state => state.auth)"]
    end

    subgraph THUNK["Async Thunk"]
        Pending["register.pending"]
        API["authService.register()"]
        Fulfilled["register.fulfilled"]
        Rejected["register.rejected"]
    end

    subgraph REDUCER["authSlice Reducer"]
        PendingR["loading: true"]
        FulfilledR["user, token, isAuthenticated"]
        RejectedR["error: message"]
    end

    subgraph STATE["Redux State"]
        AuthState["state.auth"]
    end

    subgraph UI["UI Update"]
        Render["Component re-render"]
    end

    Dispatch --> Pending
    Pending --> PendingR
    Pending --> API
    API -->|"success"| Fulfilled
    API -->|"error"| Rejected
    Fulfilled --> FulfilledR
    Rejected --> RejectedR
    PendingR --> AuthState
    FulfilledR --> AuthState
    RejectedR --> AuthState
    AuthState --> Select
    Select --> Render
```

---

## Thunk Lifecycle

```mermaid
sequenceDiagram
    participant C as Component
    participant D as dispatch()
    participant T as registerThunk
    participant S as authService
    participant A as API Server
    participant R as Reducer
    participant ST as State

    C->>D: dispatch(register(formData))
    D->>T: Execute thunk
    T->>R: register.pending
    R->>ST: { loading: true, error: null }

    T->>S: authService.register(formData)
    S->>A: POST /api/auth/register

    alt Success
        A-->>S: 200 { token, user }
        S-->>T: AuthResponse
        T->>T: localStorage.setItem("token")
        T->>R: register.fulfilled
        R->>ST: { user, token, isAuthenticated: true, loading: false }
    else Error
        A-->>S: 400 { message }
        S-->>T: AxiosError
        T->>R: register.rejected
        R->>ST: { error: message, loading: false }
    end

    ST-->>C: useSelector re-render
```

---

## File Responsibilities (SRP)

```mermaid
flowchart TB
    subgraph LAYER1["Layer 1: No Dependencies"]
        Types["types.ts<br/>─────────────<br/>컴파일 타임에만 존재<br/>런타임에 제거됨"]
    end

    subgraph LAYER2["Layer 2: Types + External"]
        API["services/api.ts<br/>─────────────<br/>HTTP 요청 전에 실행<br/>헤더/토큰 주입"]
        AuthService["services/authService.ts<br/>─────────────<br/>thunk가 호출할 때 실행<br/>실제 HTTP 통신"]
    end

    subgraph LAYER3["Layer 3: Types + Service"]
        Slice["store/authSlice.ts<br/>─────────────<br/>dispatch 시 실행<br/>상태 변경 처리"]
    end

    subgraph LAYER4["Layer 4: Slice"]
        Store["app/store.ts<br/>─────────────<br/>앱 시작 시 한 번 실행<br/>store 인스턴스 생성"]
    end

    subgraph LAYER5["Layer 5: Store"]
        Main["main.tsx<br/>─────────────<br/>앱 로드 시 최초 실행<br/>Provider 구성"]
    end

    Types --> AuthService
    API --> AuthService
    Types --> Slice
    AuthService --> Slice
    Slice --> Store
    Store --> Main
```

---

## State Shape

```mermaid
flowchart TB
    subgraph STATE["state.auth"]
        direction TB
        User["user: User | null<br/>─────────────<br/>현재 로그인한 사용자"]
        Token["token: string | null<br/>─────────────<br/>JWT for API calls"]
        IsAuth["isAuthenticated: boolean<br/>─────────────<br/>Route guard 체크용"]
        Loading["loading: boolean<br/>─────────────<br/>버튼 비활성화, 스피너"]
        Error["error: string | null<br/>─────────────<br/>에러 메시지 표시"]
    end
```

| Property | Logic 관점 | Runtime 관점 |
|----------|-----------|-------------|
| `user` | 현재 로그인한 사용자 정보 | Header에 이름 표시, Admin 체크 |
| `token` | API 인증에 필요한 JWT | axios interceptor가 헤더에 붙임 |
| `isAuthenticated` | 인증 여부 플래그 | Route guard, 조건부 UI |
| `loading` | 비동기 작업 진행 중 | 버튼 비활성화, 스피너 |
| `error` | 마지막 작업의 에러 | 사용자에게 에러 표시 |

---

## Axios Interceptor Flow

```mermaid
flowchart LR
    subgraph REQUEST["Every API Request"]
        Call["authService.register()"]
    end

    subgraph INTERCEPTOR["api.ts interceptor"]
        Check["Check localStorage"]
        AddHeader["Add Authorization header"]
    end

    subgraph AXIOS["Axios"]
        Send["Send HTTP request"]
    end

    subgraph SERVER["Backend"]
        Receive["Receive with JWT"]
    end

    Call --> Check
    Check -->|"token exists"| AddHeader
    Check -->|"no token"| Send
    AddHeader --> Send
    Send --> Receive
```

---

## Integration with RegisterForm (Task #8)

```mermaid
flowchart TB
    subgraph TASK8["Task #8: RegisterForm"]
        Form["RegisterForm"]
        Hook["useRegisterForm"]
        Validation["validation.ts"]
    end

    subgraph TASK9["Task #9: authSlice"]
        Slice["authSlice"]
        Thunk["registerThunk"]
        Service["authService"]
    end

    subgraph TASK10["Task #10: RegisterPage (Future)"]
        Page["RegisterPage"]
        DispatchCall["dispatch(register(data))"]
        SelectState["useSelector(state.auth)"]
    end

    Form -->|"onSubmit(data)"| Page
    Page --> DispatchCall
    DispatchCall --> Thunk
    Thunk --> Service
    SelectState --> Page
    Page -->|"loading, error"| Form
```

---

## Component Usage Pattern

```mermaid
flowchart TB
    subgraph PAGE["RegisterPage (Task #10)"]
        direction TB

        subgraph HOOKS["Redux Hooks"]
            UseDispatch["const dispatch = useDispatch()"]
            UseSelector["const { loading, error } = useSelector(state => state.auth)"]
        end

        subgraph HANDLER["Event Handler"]
            HandleSubmit["handleSubmit = (data) => dispatch(register(data))"]
        end

        subgraph RENDER["Render"]
            RenderForm["<RegisterForm onSubmit={handleSubmit} loading={loading} error={error} />"]
        end
    end

    UseDispatch --> HandleSubmit
    UseSelector --> RenderForm
    HandleSubmit --> RenderForm
```

---

## Error Handling Flow

```mermaid
flowchart TB
    subgraph THUNK["registerThunk"]
        TryCatch["try-catch block"]
    end

    subgraph ERROR_TYPES["Error Types"]
        AxiosError["AxiosError<br/>─────────────<br/>API 응답 에러"]
        NetworkError["Network Error<br/>─────────────<br/>연결 실패"]
        Unknown["Unknown Error<br/>─────────────<br/>예상치 못한 에러"]
    end

    subgraph REDUCER["Reducer"]
        SetError["state.error = action.payload"]
    end

    subgraph UI["UI"]
        ShowError["RegisterForm shows error"]
    end

    TryCatch -->|"catch"| AxiosError
    TryCatch -->|"catch"| NetworkError
    TryCatch -->|"catch"| Unknown
    AxiosError -->|"response.data.message"| SetError
    NetworkError -->|"'Network error'"| SetError
    Unknown -->|"'Registration failed'"| SetError
    SetError --> ShowError
```

---

## File Comparison: Before vs After

```mermaid
flowchart LR
    subgraph BEFORE["Before Task #9"]
        direction TB
        B1["types.ts (form types only)"]
        B2["RegisterForm.tsx"]
        B3["No Redux"]
        B4["No API calls"]
    end

    subgraph AFTER["After Task #9"]
        direction TB
        A1["types.ts (+ User, AuthState)"]
        A2["RegisterForm.tsx"]
        A3["authSlice.ts (Redux)"]
        A4["authService.ts (API)"]
        A5["api.ts (Axios)"]
        A6["store.ts (Store)"]
        A7["main.tsx (Provider)"]
    end

    BEFORE -->|"Task #9"| AFTER
```

| Aspect | Before | After |
|--------|--------|-------|
| State Management | Local useState | Redux global state |
| API Calls | None | authService + axios |
| Token Storage | None | localStorage + interceptor |
| Error Handling | Client validation only | + Server errors |
| Loading State | Local | Global, shareable |
