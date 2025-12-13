# Task #10 Architecture Diagram

## Overview

Task #10에서 구현한 RegisterPage의 전체 아키텍처와 데이터 흐름을 시각화합니다.

---

## react-router-dom 활용

### 설치된 패키지

```bash
npm install react-router-dom
```

### 사용된 컴포넌트/훅

| Import | 위치 | 역할 |
|--------|------|------|
| `BrowserRouter` | AppRouter.tsx | 앱 전체를 Router 컨텍스트로 감싸기 |
| `Routes` | AppRouter.tsx | 여러 Route 중 매칭되는 것 선택 |
| `Route` | AppRouter.tsx | 경로와 컴포넌트 매핑 |
| `useNavigate` | RegisterPage.tsx | 프로그래밍 방식으로 페이지 이동 |

---

### Router 구조

```mermaid
flowchart TB
    subgraph BROWSER["Browser"]
        URL["URL 입력<br/>localhost:5173/register"]
    end

    subgraph APP["App.tsx"]
        AppRouter["<AppRouter />"]
    end

    subgraph ROUTER["AppRouter.tsx (react-router-dom)"]
        BrowserRouter["BrowserRouter<br/>─────────────<br/>History API 래핑<br/>URL 변경 감지"]
        Routes["Routes<br/>─────────────<br/>자식 Route 중<br/>첫 번째 매칭 선택"]
        Route1["Route path='/'<br/>─────────────<br/>홈 페이지"]
        Route2["Route path='/register'<br/>─────────────<br/>RegisterPage"]
    end

    subgraph PAGE["RegisterPage.tsx"]
        useNavigate["useNavigate()<br/>─────────────<br/>navigate('/board')<br/>성공 시 이동"]
    end

    URL --> BrowserRouter
    AppRouter --> BrowserRouter
    BrowserRouter --> Routes
    Routes --> Route1
    Routes --> Route2
    Route2 --> PAGE
    useNavigate -.->|"isAuthenticated = true"| URL
```

---

### URL 매칭 흐름

```mermaid
sequenceDiagram
    participant B as Browser
    participant BR as BrowserRouter
    participant RS as Routes
    participant R as Route
    participant P as RegisterPage

    B->>BR: URL: /register
    BR->>RS: 현재 경로 전달
    RS->>R: path="/register" 매칭 확인
    R->>P: element={<RegisterPage />} 렌더링

    Note over P: 회원가입 성공 시
    P->>BR: navigate("/board")
    BR->>B: URL 변경: /board
```

---

## Container/Presentational 패턴

### 컴포넌트 역할 분리

```mermaid
flowchart TB
    subgraph CONTAINER["Container Layer (RegisterPage)"]
        Page["RegisterPage.tsx<br/>─────────────<br/>• Redux 연결 (useAppSelector)<br/>• 액션 dispatch (useAppDispatch)<br/>• 네비게이션 (useNavigate)<br/>• 비즈니스 로직"]
    end

    subgraph PRESENTATIONAL["Presentational Layer (RegisterForm)"]
        Form["RegisterForm.tsx<br/>─────────────<br/>• UI 렌더링만<br/>• Props로 데이터 수신<br/>• Props로 이벤트 전달<br/>• Redux 모름"]
    end

    subgraph PROPS["Props 전달"]
        onSubmit["onSubmit: (data) => void"]
        loading["loading: boolean"]
        error["error: string | null"]
    end

    Page -->|"props"| PROPS
    PROPS --> Form
    Form -->|"onSubmit(formData)"| Page
```

---

### Why 분리?

| 측면 | RegisterForm (Presentational) | RegisterPage (Container) |
|------|------------------------------|-------------------------|
| **알고 있는 것** | Props만 | Redux, Router, 비즈니스 로직 |
| **테스트** | Props 주입만으로 테스트 | Redux mock 필요 |
| **재사용** | 어디서든 사용 가능 | /register 경로 전용 |
| **변경 이유** | UI/스타일 변경 | 상태 로직, 네비게이션 변경 |

---

## Typed Redux Hooks 흐름

### hooks.ts 역할

```mermaid
flowchart LR
    subgraph STORE["app/store.ts"]
        RootState["RootState<br/>─────────────<br/>전체 상태 타입"]
        AppDispatch["AppDispatch<br/>─────────────<br/>dispatch 타입"]
    end

    subgraph HOOKS["app/hooks.ts"]
        useAppSelector["useAppSelector<br/>─────────────<br/>TypedUseSelectorHook<br/><RootState>"]
        useAppDispatch["useAppDispatch<br/>─────────────<br/>() => AppDispatch"]
    end

    subgraph PAGE["RegisterPage.tsx"]
        selector["useAppSelector(<br/>  state => state.auth<br/>)"]
        dispatch["useAppDispatch()"]
    end

    RootState --> useAppSelector
    AppDispatch --> useAppDispatch
    useAppSelector --> selector
    useAppDispatch --> dispatch
```

---

### 타입 안전성 비교

```typescript
// ❌ Without typed hooks (매번 타입 지정 필요)
const dispatch = useDispatch<AppDispatch>();
const { user } = useSelector((state: RootState) => state.auth);

// ✅ With typed hooks (타입 자동 적용)
const dispatch = useAppDispatch();
const { user } = useAppSelector(state => state.auth);  // state 타입 자동완성
```

---

## 전체 데이터 흐름 (E2E)

### 회원가입 성공 시나리오

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant AR as AppRouter
    participant RP as RegisterPage
    participant RF as RegisterForm
    participant H as hooks.ts
    participant S as authSlice
    participant API as Backend

    U->>B: localhost:5173/register 접속
    B->>AR: URL 매칭
    AR->>RP: Route path="/register" → RegisterPage 렌더링

    RP->>H: useAppSelector(state => state.auth)
    H-->>RP: { loading: false, error: null, isAuthenticated: false }

    RP->>RF: <RegisterForm onSubmit loading error />
    RF->>U: 폼 UI 표시

    U->>RF: 폼 입력 + Submit
    RF->>RP: onSubmit(formData)

    RP->>H: useAppDispatch()
    RP->>S: dispatch(register(formData))

    S->>S: pending → loading: true
    S->>API: POST /api/auth/register
    API-->>S: { token, user }
    S->>S: fulfilled → isAuthenticated: true

    Note over S: localStorage.setItem("token", token)

    S-->>RP: 상태 변경 감지 (re-render)
    RP->>RP: useEffect: isAuthenticated === true
    RP->>AR: navigate("/board")
    AR->>B: URL 변경
```

---

### 회원가입 실패 시나리오

```mermaid
sequenceDiagram
    participant U as User
    participant RP as RegisterPage
    participant RF as RegisterForm
    participant S as authSlice
    participant API as Backend

    U->>RF: 중복 이메일로 Submit
    RF->>RP: onSubmit(formData)
    RP->>S: dispatch(register(formData))

    S->>S: pending → loading: true, error: null
    S->>API: POST /api/auth/register
    API-->>S: 400 { message: "Email already exists" }
    S->>S: rejected → loading: false, error: "Email already exists"

    S-->>RP: 상태 변경 감지
    RP->>RF: error="Email already exists" prop 전달
    RF->>U: 빨간 에러 박스 표시
```

---

## 파일 의존성 다이어그램

```mermaid
flowchart TB
    subgraph EXTERNAL["External Libraries"]
        RRD["react-router-dom<br/>─────────────<br/>BrowserRouter<br/>Routes, Route<br/>useNavigate"]
        RR["react-redux<br/>─────────────<br/>useDispatch<br/>useSelector"]
    end

    subgraph APP_INFRA["App Infrastructure"]
        Store["app/store.ts<br/>─────────────<br/>configureStore<br/>RootState, AppDispatch"]
        Hooks["app/hooks.ts<br/>─────────────<br/>useAppDispatch<br/>useAppSelector"]
    end

    subgraph AUTH_FEATURE["features/auth/"]
        Slice["store/authSlice.ts<br/>─────────────<br/>register thunk<br/>상태 관리"]
        Form["components/RegisterForm.tsx<br/>─────────────<br/>Presentational<br/>UI only"]
        Page["pages/RegisterPage.tsx<br/>─────────────<br/>Container<br/>Redux + Router 연결"]
    end

    subgraph ROUTER["router/"]
        AppRouter["AppRouter.tsx<br/>─────────────<br/>경로 정의<br/>페이지 매핑"]
    end

    subgraph ENTRY["Entry Point"]
        App["App.tsx<br/>─────────────<br/>AppRouter 렌더링"]
    end

    RRD --> AppRouter
    RRD --> Page
    RR --> Hooks
    Store --> Hooks
    Hooks --> Page
    Slice --> Page
    Form --> Page
    Page --> AppRouter
    AppRouter --> App
```

---

## 레이어별 책임 요약

| Layer | 파일 | 책임 | 의존성 |
|-------|------|------|--------|
| **Entry** | App.tsx | Router 렌더링 | AppRouter |
| **Router** | AppRouter.tsx | URL → Page 매핑 | react-router-dom, Pages |
| **Container** | RegisterPage.tsx | Redux + Router 연결 | hooks.ts, authSlice, RegisterForm |
| **Presentational** | RegisterForm.tsx | UI 렌더링 | Props only |
| **State** | authSlice.ts | 상태 + 액션 | authService |
| **Infrastructure** | hooks.ts | Typed hooks | store.ts |

---

## Related Documentation

- [02-container-pattern.md](./02-container-pattern.md) - Container/Presentational 패턴 상세
- [03-routing-layer.md](./03-routing-layer.md) - Router + Hooks 분석
- [04-design-patterns-and-solid.md](./04-design-patterns-and-solid.md) - 적용된 디자인 패턴
- [05-programming-concepts.md](./05-programming-concepts.md) - 프로그래밍 개념 정리
