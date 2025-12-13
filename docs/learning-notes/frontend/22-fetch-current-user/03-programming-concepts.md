# Programming Concepts

## Overview

Task #22 fetchCurrentUser 구현에서 사용된 프로그래밍 개념들

---

## 1. createAsyncThunk with No Arguments

### 일반 Thunk vs 인자 없는 Thunk

```mermaid
graph LR
    subgraph with_args["인자 있는 Thunk"]
        A1["login(formData)"]
        A2["register(formData)"]
    end

    subgraph no_args["인자 없는 Thunk"]
        B1["fetchCurrentUser()"]
    end
```

### 코드 비교

```typescript
// 인자가 있는 경우
export const login = createAsyncThunk(
  "auth/login",
  async (data: LoginFormData, { rejectWithValue }) => {
    // data 사용
  }
);

// 인자가 없는 경우 (fetchCurrentUser)
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {  // _ = 사용하지 않는 파라미터
    // 인자 없이 호출됨
  }
);
```

**`_` 의미:**
- 컨벤션: "이 파라미터는 사용하지 않음"
- TypeScript가 필수 파라미터 자리 채움
- `void`로 타입 지정 가능

---

## 2. localStorage API

### 기본 메서드

```mermaid
graph TB
    subgraph localStorage_API["localStorage API"]
        SET["setItem(key, value)<br/>저장"]
        GET["getItem(key)<br/>조회"]
        REMOVE["removeItem(key)<br/>삭제"]
        CLEAR["clear()<br/>전체 삭제"]
    end
```

### 이 프로젝트에서 사용

```typescript
// 저장 (로그인 성공 시)
localStorage.setItem("token", response.token);

// 조회 (세션 복원 시)
const token = localStorage.getItem("token");

// 삭제 (로그아웃 또는 토큰 만료 시)
localStorage.removeItem("token");
```

### 주의사항

| 항목 | 설명 |
|------|------|
| **문자열만** | 객체 저장 시 JSON.stringify 필요 |
| **동기식** | 메인 스레드 블로킹 (큰 데이터 주의) |
| **보안** | XSS 취약, 민감 정보 저장 주의 |
| **용량** | ~5MB 제한 |

---

## 3. Axios Interceptors

### 개념

```mermaid
sequenceDiagram
    participant App as Application
    participant RI as Request Interceptor
    participant Server as Server
    participant ResI as Response Interceptor

    App->>RI: request config
    Note over RI: 헤더 추가, 변환 등
    RI->>Server: modified request

    Server-->>ResI: response
    Note over ResI: 에러 처리, 변환 등
    ResI-->>App: modified response
```

### Request Interceptor 코드

```typescript
// src/services/api.ts
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;  // 반드시 config 반환
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

### 왜 Interceptor를 사용하나?

```mermaid
graph TB
    subgraph Without["Interceptor 없이"]
        W1["authService.login()에 token 추가"]
        W2["authService.fetchCurrentUser()에 token 추가"]
        W3["taskService.getTasks()에 token 추가"]
        W4["모든 API에 중복 코드"]
    end

    subgraph With["Interceptor 사용"]
        I1["한 곳에서 설정"]
        I2["모든 요청에 자동 적용"]
    end

    Without -->|DRY 원칙| With

    style With fill:#90EE90
```

---

## 4. useEffect with Empty Dependency Array

### 동작 방식

```mermaid
graph TB
    subgraph Empty_Deps["useEffect(fn, [])"]
        E1["컴포넌트 마운트 시 1번 실행"]
        E2["리렌더링 시 실행 안 함"]
        E3["언마운트 시 cleanup 실행"]
    end

    subgraph With_Deps["useEffect(fn, [dep])"]
        D1["마운트 시 실행"]
        D2["dep 변경 시마다 실행"]
    end

    subgraph No_Deps["useEffect(fn)"]
        N1["마운트 시 실행"]
        N2["모든 리렌더링마다 실행"]
    end
```

### 이 프로젝트에서

```typescript
// 앱 시작 시 1번만 실행 (계획)
useEffect(() => {
  const token = localStorage.getItem("token");
  if (token && !isAuthenticated) {
    dispatch(fetchCurrentUser());
  }
}, []);  // 빈 배열 = 마운트 시 1번만
```

**왜 빈 배열?**
- 세션 복원은 앱 시작 시 1번만 필요
- 리렌더링마다 API 호출하면 비효율적

---

## 5. Redux Selector Pattern

### useAppSelector 사용

```mermaid
graph LR
    subgraph Store["Redux Store"]
        S["state.auth.isAuthenticated"]
    end

    subgraph Component["Component"]
        C["useAppSelector(state => state.auth)"]
    end

    Store -->|구독| Component
    Store -->|변경 시| Component
```

### 코드 예시

```typescript
// 전체 auth 상태 가져오기
const { isAuthenticated } = useAppSelector((state) => state.auth);

// 특정 값만 가져오기 (성능 최적화)
const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
```

### 리렌더링 최적화

```mermaid
graph TB
    subgraph Wide["넓은 선택"]
        W1["const auth = useAppSelector(state => state.auth)"]
        W2["auth 객체의 어떤 속성이라도 변경되면 리렌더링"]
    end

    subgraph Narrow["좁은 선택"]
        N1["const isAuth = useAppSelector(state => state.auth.isAuthenticated)"]
        N2["isAuthenticated만 변경될 때 리렌더링"]
    end

    Narrow -->|더 효율적| Better[권장]

    style Better fill:#90EE90
```

---

## 6. extraReducers Builder Pattern

### 패턴 설명

```mermaid
graph TB
    subgraph Builder["Builder Pattern"]
        B1[".addCase(action1, reducer1)"]
        B2[".addCase(action2, reducer2)"]
        B3[".addCase(action3, reducer3)"]
    end

    B1 --> B2
    B2 --> B3
```

### 코드 구조

```typescript
extraReducers: (builder) => {
  builder
    // 첫 번째 케이스
    .addCase(fetchCurrentUser.pending, (state) => {
      state.loading = true;
    })
    // 두 번째 케이스 (체이닝)
    .addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
    })
    // 세 번째 케이스 (체이닝)
    .addCase(fetchCurrentUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
}
```

### Builder Pattern 장점

| 장점 | 설명 |
|------|------|
| **타입 안전성** | TypeScript가 action.payload 타입 추론 |
| **가독성** | 체이닝으로 순차적 정의 |
| **확장성** | 새 케이스 추가 쉬움 |
| **IDE 지원** | 자동완성, 오류 감지 |

---

## 7. Type Assertion vs Type Guard

### rejectWithValue 사용 시

```typescript
.addCase(fetchCurrentUser.rejected, (state, action) => {
  state.error = action.payload as string;  // Type Assertion
})
```

### 왜 `as string`?

```mermaid
graph TB
    RWV["rejectWithValue(message)"]
    Payload["action.payload 타입: unknown"]
    Assert["as string으로 타입 단언"]

    RWV --> Payload
    Payload --> Assert
```

**이유:**
- `rejectWithValue`의 반환 타입이 `unknown`
- 우리는 항상 string을 전달하므로 `as string`으로 단언
- 더 안전한 방법: `createAsyncThunk`의 제네릭 사용

---

## 8. 요약: 주요 개념

```mermaid
graph TB
    subgraph Concepts["Task #22 핵심 개념"]
        C1["createAsyncThunk<br/>인자 없는 버전"]
        C2["localStorage<br/>토큰 저장/조회/삭제"]
        C3["Axios Interceptor<br/>자동 헤더 추가"]
        C4["useEffect []<br/>마운트 시 1회 실행"]
        C5["useAppSelector<br/>상태 구독"]
        C6["extraReducers<br/>Builder Pattern"]
    end
```

| 개념 | 용도 |
|------|------|
| `_` 파라미터 | 사용하지 않는 인자 표시 |
| localStorage | 브라우저에 토큰 영구 저장 |
| Interceptor | 모든 요청에 토큰 자동 추가 |
| useEffect([]) | 앱 시작 시 1번 실행 |
| useAppSelector | Redux 상태 구독 |
| builder.addCase | 타입 안전한 리듀서 추가 |
