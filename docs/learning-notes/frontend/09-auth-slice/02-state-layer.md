# authSlice - State Layer

## Overview

State Layer는 Redux를 사용하여 앱 전체의 인증 상태를 관리합니다.

| 파일 | 역할 |
|------|------|
| `store/authSlice.ts` | 상태 정의 + Reducer + Async Thunk |
| `app/store.ts` | Redux Store 구성 + 타입 정의 |
| `main.tsx` | Provider로 앱에 Store 주입 |

---

## authSlice.ts 분석

### 1. Initial State

```typescript
const initialState: AuthState = {
  user: null,          // 로그인한 사용자 정보
  token: null,         // JWT 토큰
  isAuthenticated: false,  // 인증 여부
  loading: false,      // 비동기 작업 중
  error: null,         // 에러 메시지
};
```

```mermaid
flowchart TB
    subgraph INITIAL["Initial State (앱 시작)"]
        direction TB
        User["user: null"]
        Token["token: null"]
        IsAuth["isAuthenticated: false"]
        Loading["loading: false"]
        Error["error: null"]
    end

    subgraph MEANING["의미"]
        M1["로그인 안 됨"]
        M2["API 호출에 토큰 없음"]
        M3["보호된 페이지 접근 불가"]
        M4["버튼 활성화 상태"]
        M5["에러 메시지 없음"]
    end

    User --> M1
    Token --> M2
    IsAuth --> M3
    Loading --> M4
    Error --> M5
```

---

### 2. createAsyncThunk - register

```mermaid
flowchart TB
    subgraph THUNK["createAsyncThunk 구조"]
        direction TB

        subgraph DEFINITION["정의"]
            Name["'auth/register'<br/>─────────────<br/>액션 타입 prefix"]
            Payload["RegisterFormData<br/>─────────────<br/>컴포넌트가 전달하는 데이터"]
        end

        subgraph CALLBACK["async callback"]
            direction TB
            Try["try: authService.register(data)"]
            Success["성공: localStorage 저장 + return response"]
            Catch["catch: rejectWithValue(error)"]
        end

        subgraph GENERATED["자동 생성 액션"]
            Pending["register.pending"]
            Fulfilled["register.fulfilled"]
            Rejected["register.rejected"]
        end
    end

    DEFINITION --> CALLBACK --> GENERATED
```

**코드 분석:**

```typescript
export const register = createAsyncThunk(
  "auth/register",  // 액션 타입: auth/register/pending, auth/register/fulfilled, auth/register/rejected
  async (data: RegisterFormData, { rejectWithValue }) => {
    try {
      const response = await authService.register(data);
      localStorage.setItem("token", response.token);  // Side effect는 thunk에서
      return response;  // → fulfilled payload
    } catch (error: unknown) {
      // 에러 메시지 추출
      if (error instanceof Error && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        return rejectWithValue(axiosError.response?.data?.message || "Registration failed");
      }
      return rejectWithValue("Registration failed");  // → rejected payload
    }
  }
);
```

**왜 localStorage를 thunk에서 처리하는가?**

| 위치 | 가능? | 이유 |
|------|-------|------|
| Reducer 안에서 | ❌ | Reducer는 순수 함수여야 함 (Side Effect 금지) |
| Thunk 안에서 | ✅ | Thunk는 Side Effect 허용 (비동기, API, localStorage 등) |

---

### 3. createSlice - Reducers

```mermaid
flowchart TB
    subgraph SLICE["createSlice 구조"]
        direction TB

        subgraph SYNC["reducers (동기 액션)"]
            Logout["logout<br/>─────────────<br/>상태 초기화<br/>localStorage 삭제"]
            ClearError["clearError<br/>─────────────<br/>error: null"]
        end

        subgraph ASYNC["extraReducers (비동기 액션)"]
            Pending["register.pending<br/>─────────────<br/>loading: true<br/>error: null"]
            Fulfilled["register.fulfilled<br/>─────────────<br/>loading: false<br/>user, token 저장<br/>isAuthenticated: true"]
            Rejected["register.rejected<br/>─────────────<br/>loading: false<br/>error: 메시지"]
        end
    end

    SYNC --> ASYNC
```

**extraReducers 코드:**

```typescript
extraReducers: (builder) => {
  builder
    .addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(register.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    })
    .addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
}
```

**Builder Pattern 사용 이유:**

```mermaid
flowchart LR
    subgraph BUILDER["Builder Pattern"]
        direction TB

        subgraph OLD["Map Object 방식 (구식)"]
            O["{ [register.pending]: (state) => {...} }<br/>─────────────<br/>타입 추론 약함"]
        end

        subgraph NEW["Builder 방식 (현재)"]
            N["builder.addCase(register.pending, ...)<br/>─────────────<br/>타입 완벽 추론"]
        end
    end

    OLD -->|"Migration"| NEW
```

---

### 4. 상태 변화 흐름

```mermaid
stateDiagram-v2
    [*] --> Initial: 앱 시작

    Initial --> Loading: dispatch(register(data))
    Loading --> Authenticated: API 성공
    Loading --> Error: API 실패

    Authenticated --> Initial: dispatch(logout())
    Error --> Loading: 재시도

    state Initial {
        user: null
        isAuthenticated: false
        loading: false
    }

    state Loading {
        loading: true
        error: null
    }

    state Authenticated {
        user: User
        token: JWT
        isAuthenticated: true
        loading: false
    }

    state Error {
        error: "message"
        loading: false
    }
```

---

## store.ts 분석

### 1. configureStore

```typescript
export const store = configureStore({
  reducer: {
    auth: authReducer,
    // task: taskReducer,  (미래)
    // user: userReducer,  (미래)
  },
});
```

```mermaid
flowchart TB
    subgraph STORE["Redux Store"]
        direction TB

        subgraph CONFIG["configureStore()"]
            DevTools["DevTools 자동 설정"]
            Middleware["Thunk middleware 자동 포함"]
            Immutable["Immutability 체크 (개발 모드)"]
        end

        subgraph REDUCER["Combined Reducer"]
            Auth["auth: authReducer"]
            Task["task: (future)"]
            User["user: (future)"]
        end

        subgraph STATE["Resulting State Shape"]
            S["state.auth.user<br/>state.auth.token<br/>state.auth.loading<br/>..."]
        end
    end

    CONFIG --> REDUCER --> STATE
```

**configureStore vs createStore:**

| 기능 | createStore (Legacy) | configureStore (RTK) |
|------|---------------------|---------------------|
| Redux DevTools | 수동 설정 필요 | 자동 |
| Thunk Middleware | 수동 추가 | 자동 포함 |
| Immutability 체크 | 없음 | 개발 모드에서 자동 |
| 코드량 | 많음 | 적음 |

---

### 2. Type Exports

```typescript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```mermaid
flowchart LR
    subgraph TYPES["Store Types"]
        direction TB

        subgraph ROOT["RootState"]
            R["전체 상태의 타입<br/>─────────────<br/>{ auth: AuthState, task: TaskState, ... }"]
        end

        subgraph DISPATCH["AppDispatch"]
            D["dispatch 함수의 타입<br/>─────────────<br/>thunk 액션도 지원"]
        end

        subgraph USAGE["사용처"]
            U1["useSelector((state: RootState) => ...)"]
            U2["useDispatch<AppDispatch>()"]
        end
    end

    ROOT --> U1
    DISPATCH --> U2
```

**왜 이 타입들이 필요한가?**

```typescript
// ❌ 타입 없이 - 자동완성 안 됨
const user = useSelector(state => state.auth.user);  // state: unknown

// ✅ RootState 사용 - 완벽한 타입 추론
const user = useSelector((state: RootState) => state.auth.user);  // state.auth.user: User | null

// ❌ 기본 Dispatch - thunk 액션 타입 오류
const dispatch = useDispatch();
dispatch(register(data));  // 타입 오류 가능

// ✅ AppDispatch 사용 - thunk 완벽 지원
const dispatch = useDispatch<AppDispatch>();
dispatch(register(data));  // OK
```

---

## main.tsx - Provider 연결

```typescript
import { Provider } from "react-redux";
import { store } from "./app/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
```

```mermaid
flowchart TB
    subgraph PROVIDER["Provider Pattern"]
        direction TB

        subgraph REACT_TREE["React Component Tree"]
            Root["<Provider store={store}>"]
            App["<App />"]
            Page["RegisterPage"]
            Form["RegisterForm"]
        end

        subgraph CONTEXT["React Context 내부"]
            Store["Redux Store"]
        end

        subgraph HOOKS["어디서든 접근"]
            UseSelector["useSelector() → state 읽기"]
            UseDispatch["useDispatch() → action 전송"]
        end
    end

    Root -->|"store prop"| Store
    Root --> App --> Page --> Form
    Store --> UseSelector
    Store --> UseDispatch
    Form -.->|"사용"| UseSelector
    Form -.->|"사용"| UseDispatch
```

**Provider 위치의 중요성:**

| Provider 위치 | 결과 |
|--------------|------|
| App 바깥 (현재) | 모든 컴포넌트에서 Redux 접근 가능 |
| App 안쪽 특정 부분 | 해당 부분만 Redux 접근 가능 |
| 없음 | useSelector/useDispatch 호출 시 오류 |

---

## State Layer 전체 흐름

```mermaid
sequenceDiagram
    participant C as Component
    participant D as dispatch()
    participant S as Store
    participant T as Thunk
    participant R as Reducer
    participant ST as State

    Note over C,ST: 1. 컴포넌트에서 dispatch

    C->>D: dispatch(register(formData))
    D->>S: 액션 전달
    S->>T: Thunk middleware가 함수 감지

    Note over T: 2. Thunk 실행

    T->>S: register.pending 액션 생성
    S->>R: pending 처리
    R->>ST: loading: true

    T->>T: await authService.register()

    alt Success
        T->>T: localStorage.setItem("token")
        T->>S: register.fulfilled 액션 생성
        S->>R: fulfilled 처리
        R->>ST: user, token, isAuthenticated: true
    else Error
        T->>S: register.rejected 액션 생성
        S->>R: rejected 처리
        R->>ST: error: message
    end

    Note over C,ST: 3. 상태 변경 → 리렌더

    ST-->>C: useSelector가 변경 감지
    C->>C: 리렌더링
```

---

## 핵심 개념 정리

| 개념 | 설명 | Task #9에서 |
|------|------|------------|
| **Slice** | 관련 상태 + 액션 + 리듀서를 하나로 묶음 | `authSlice` |
| **Async Thunk** | 비동기 로직 + 3가지 액션 자동 생성 | `register` thunk |
| **extraReducers** | 외부 액션(thunk 등)에 응답 | pending/fulfilled/rejected 처리 |
| **Store** | 전역 상태 보관소 | `configureStore` |
| **Provider** | React Context로 Store 주입 | `<Provider store={store}>` |
| **RootState** | 전체 상태의 타입 | `ReturnType<typeof store.getState>` |
| **AppDispatch** | Dispatch 함수의 타입 (thunk 지원) | `typeof store.dispatch` |

---

## 파일별 책임 (SRP)

| 파일 | 단일 책임 | 변경 시점 |
|------|----------|----------|
| `authSlice.ts` | Auth 상태의 생명주기 관리 | 상태 구조 변경, 새 액션 추가 |
| `store.ts` | 전체 Store 구성 | 새 feature slice 추가 |
| `main.tsx` | 앱 진입점, Provider 구성 | 새 Provider 추가 |
