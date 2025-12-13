# authSlice - Service Layer

## Overview

Service Layer는 API 통신을 담당합니다. Redux(State Layer)와 Backend 사이의 중간 계층입니다.

| 파일 | 역할 |
|------|------|
| `services/api.ts` | Axios 인스턴스 + Request Interceptor |
| `features/auth/services/authService.ts` | Auth 관련 API 엔드포인트 호출 |

---

## 레이어 구조

```mermaid
flowchart TB
    subgraph LAYERS["Frontend Layers"]
        direction TB

        subgraph UI["UI Layer"]
            Component["RegisterPage<br/>RegisterForm"]
        end

        subgraph STATE["State Layer"]
            Slice["authSlice<br/>register thunk"]
        end

        subgraph SERVICE["Service Layer"]
            AuthService["authService.register()"]
            API["api.ts (axios instance)"]
        end

        subgraph NETWORK["Network"]
            HTTP["HTTP Request"]
        end

        subgraph BACKEND["Backend"]
            Server["ASP.NET API"]
        end
    end

    Component -->|"dispatch"| Slice
    Slice -->|"calls"| AuthService
    AuthService -->|"uses"| API
    API -->|"sends"| HTTP
    HTTP -->|"to"| Server
```

---

## api.ts 분석

### 1. Axios Instance 생성

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://localhost:7001/api",
  headers: {
    "Content-Type": "application/json",
  },
});
```

```mermaid
flowchart LR
    subgraph AXIOS_CREATE["axios.create() 설정"]
        direction TB

        subgraph BASE["baseURL"]
            B["모든 요청의 기본 URL<br/>─────────────<br/>api.post('/auth/register')<br/>→ https://localhost:7001/api/auth/register"]
        end

        subgraph HEADERS["headers"]
            H["기본 헤더<br/>─────────────<br/>Content-Type: application/json<br/>모든 요청에 자동 적용"]
        end

        subgraph ENV["환경 변수"]
            E["import.meta.env.VITE_API_URL<br/>─────────────<br/>개발: localhost:7001<br/>프로덕션: 실제 서버 URL"]
        end
    end
```

**왜 Instance를 만드는가?**

| 방식 | 코드 | 문제점 |
|------|------|--------|
| 직접 사용 | `axios.post('https://localhost:7001/api/auth/register')` | 매번 URL 반복, 설정 중복 |
| Instance 사용 | `api.post('/auth/register')` | 한 번 설정, 모든 곳에서 재사용 |

---

### 2. Request Interceptor

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

```mermaid
flowchart TB
    subgraph INTERCEPTOR["Request Interceptor 흐름"]
        direction TB

        subgraph TRIGGER["API 호출 시작"]
            Call["authService.register(data)<br/>또는<br/>api.get('/tasks')"]
        end

        subgraph INTERCEPT["Interceptor 실행"]
            Check["localStorage에서 token 확인"]
            HasToken{"token 있음?"}
            AddHeader["Authorization: Bearer {token}<br/>헤더 추가"]
            NoHeader["헤더 없이 진행"]
        end

        subgraph SEND["요청 전송"]
            Request["HTTP Request 전송"]
        end
    end

    Call --> Check
    Check --> HasToken
    HasToken -->|"Yes"| AddHeader
    HasToken -->|"No"| NoHeader
    AddHeader --> Request
    NoHeader --> Request
```

**Interceptor가 실행되는 시점:**

```mermaid
sequenceDiagram
    participant C as Component
    participant S as authService
    participant I as Interceptor
    participant A as Axios
    participant B as Backend

    C->>S: register(data)
    S->>A: api.post('/auth/register', data)

    Note over I: Interceptor 실행 시점

    A->>I: Request Config
    I->>I: token 확인
    I->>A: Config + Auth Header (있으면)

    A->>B: HTTP POST
    B-->>A: Response
    A-->>S: Response
    S-->>C: AuthResponse
```

**토큰 유무에 따른 요청:**

| 상황 | localStorage | 헤더 |
|------|-------------|------|
| 로그인 전 (회원가입) | token 없음 | `Content-Type: application/json` 만 |
| 로그인 후 (Task 조회) | token 있음 | `Authorization: Bearer {token}` 추가 |

---

### 3. Interceptor의 장점

```mermaid
flowchart LR
    subgraph WITHOUT["❌ Interceptor 없이"]
        direction TB
        W1["api.get('/tasks', {<br/>  headers: { Authorization: token }<br/>})"]
        W2["api.post('/tasks', data, {<br/>  headers: { Authorization: token }<br/>})"]
        W3["api.put('/tasks/1', data, {<br/>  headers: { Authorization: token }<br/>})"]
    end

    subgraph WITH["✅ Interceptor 사용"]
        direction TB
        C1["api.get('/tasks')"]
        C2["api.post('/tasks', data)"]
        C3["api.put('/tasks/1', data)"]
        I["Interceptor가 자동으로<br/>token 헤더 추가"]
    end

    WITHOUT -->|"중복 제거"| WITH
```

---

## authService.ts 분석

### 1. Service Object Pattern

```typescript
export const authService = {
  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", {
      name: data.name,
      email: data.email,
      username: data.username,
      password: data.password,
    });
    return response.data;
  },

  // login은 Story 1.2에서 구현 예정
};
```

```mermaid
flowchart TB
    subgraph SERVICE["authService Object"]
        direction TB

        subgraph METHODS["Methods"]
            Register["register(data)<br/>─────────────<br/>POST /auth/register"]
            Login["login(credentials)<br/>─────────────<br/>POST /auth/login<br/>(Story 1.2)"]
            Refresh["refreshToken()<br/>─────────────<br/>POST /auth/refresh<br/>(Story 1.4)"]
        end

        subgraph SHARED["공통 사용"]
            API["api instance<br/>─────────────<br/>baseURL, interceptor"]
        end
    end

    METHODS --> API
```

---

### 2. 데이터 변환

```mermaid
flowchart LR
    subgraph INPUT["RegisterFormData (Frontend)"]
        I["name<br/>email<br/>username<br/>password<br/>confirmPassword ← 제거"]
    end

    subgraph OUTPUT["API Request Body"]
        O["name<br/>email<br/>username<br/>password"]
    end

    subgraph WHY["왜 변환?"]
        W["confirmPassword는<br/>프론트엔드 검증용<br/>서버에 보낼 필요 없음"]
    end

    INPUT -->|"변환"| OUTPUT
    INPUT --> WHY
```

**코드에서 변환:**

```typescript
register: async (data: RegisterFormData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/register", {
    name: data.name,
    email: data.email,
    username: data.username,
    password: data.password,
    // confirmPassword는 보내지 않음 ← 의도적 제외
  });
  return response.data;
}
```

---

### 3. 타입 안전성

```mermaid
flowchart TB
    subgraph TYPES["TypeScript 타입 흐름"]
        direction TB

        subgraph INPUT_TYPE["Input Type"]
            IT["RegisterFormData<br/>─────────────<br/>함수 파라미터 타입"]
        end

        subgraph AXIOS_TYPE["Axios Generic"]
            AT["api.post<AuthResponse><br/>─────────────<br/>응답 타입 지정"]
        end

        subgraph RETURN_TYPE["Return Type"]
            RT["Promise<AuthResponse><br/>─────────────<br/>함수 반환 타입"]
        end

        subgraph BENEFIT["장점"]
            B1["response.data 타입 자동 추론"]
            B2["잘못된 필드 접근 시 컴파일 에러"]
        end
    end

    INPUT_TYPE --> AT
    AT --> RT
    RT --> BENEFIT
```

**타입 안전성 예시:**

```typescript
// ✅ 올바른 접근 - 타입 체크 통과
register: async (data: RegisterFormData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/register", {...});
  return response.data;  // AuthResponse 타입
}

// thunk에서 사용
const response = await authService.register(data);
response.token;  // ✅ string
response.user;   // ✅ User
response.foo;    // ❌ 컴파일 에러: Property 'foo' does not exist
```

---

## Service Layer 전체 흐름

```mermaid
sequenceDiagram
    participant T as Thunk (authSlice)
    participant S as authService
    participant A as api.ts
    participant I as Interceptor
    participant B as Backend

    T->>S: authService.register(formData)

    Note over S: 1. 데이터 변환<br/>confirmPassword 제거

    S->>A: api.post('/auth/register', data)

    Note over I: 2. Interceptor 실행<br/>token 확인 (이 시점엔 없음)

    I->>A: config 반환 (헤더 없음)
    A->>B: POST /api/auth/register

    alt Success
        B-->>A: 200 { token, user, ... }
        A-->>S: AxiosResponse<AuthResponse>
        S-->>T: AuthResponse
    else Error
        B-->>A: 400 { message: "Email exists" }
        A-->>S: AxiosError
        S-->>T: throw error
    end
```

---

## api.ts vs authService.ts 비교

| 측면 | api.ts | authService.ts |
|------|--------|----------------|
| **위치** | `src/services/` | `src/features/auth/services/` |
| **범위** | App-wide (모든 feature) | Auth feature 전용 |
| **역할** | HTTP 인프라 설정 | 비즈니스 로직 (어떤 엔드포인트 호출) |
| **내용** | baseURL, headers, interceptor | register(), login(), ... |
| **변경 시점** | API 서버 URL 변경, 인증 방식 변경 | Auth 엔드포인트 변경, 새 인증 기능 추가 |

```mermaid
flowchart TB
    subgraph SCOPE["파일 범위"]
        direction LR

        subgraph APP_WIDE["App-Wide (src/services/)"]
            API["api.ts<br/>─────────────<br/>모든 feature가 공유"]
        end

        subgraph FEATURE["Feature-Specific"]
            Auth["authService.ts<br/>─────────────<br/>Auth만 사용"]
            Task["taskService.ts<br/>─────────────<br/>Task만 사용<br/>(미래)"]
            User["userService.ts<br/>─────────────<br/>User만 사용<br/>(미래)"]
        end
    end

    Auth --> API
    Task --> API
    User --> API
```

---

## 에러 처리 흐름

```mermaid
flowchart TB
    subgraph ERROR_FLOW["에러 처리 흐름"]
        direction TB

        subgraph SERVICE["authService"]
            S["await api.post(...)<br/>─────────────<br/>에러 발생 시 throw"]
        end

        subgraph THUNK["authSlice thunk"]
            T["try-catch<br/>─────────────<br/>에러 캐치 및 처리"]
        end

        subgraph REJECT["rejectWithValue"]
            R["에러 메시지 추출<br/>─────────────<br/>response.data.message"]
        end

        subgraph REDUCER["rejected reducer"]
            RD["state.error = message"]
        end

        subgraph UI["Component"]
            U["에러 메시지 표시"]
        end
    end

    SERVICE -->|"throw"| THUNK
    THUNK -->|"catch"| REJECT
    REJECT -->|"payload"| REDUCER
    REDUCER -->|"state"| UI
```

**왜 Service에서 에러를 처리하지 않는가?**

| 처리 위치 | 장점 | 단점 |
|----------|------|------|
| Service에서 | 한 곳에서 처리 | 호출자가 에러 유형 모름 |
| Thunk에서 (현재) | 상황별 다른 처리 가능 | 약간의 중복 |

현재 방식에서는 Thunk가 에러를 캐치하여:
1. 에러 메시지 추출
2. `rejectWithValue`로 Redux 상태에 반영
3. UI에서 상태를 읽어 표시

---

## 핵심 개념 정리

| 개념 | 설명 | Task #9에서 |
|------|------|------------|
| **Axios Instance** | 공통 설정을 가진 HTTP 클라이언트 | `api.ts` |
| **Request Interceptor** | 모든 요청 전에 실행되는 함수 | Token 자동 첨부 |
| **Service Object** | 관련 API 호출을 그룹화 | `authService` |
| **Data Transformation** | Frontend ↔ Backend 데이터 변환 | confirmPassword 제거 |
| **Type Safety** | 제네릭으로 응답 타입 지정 | `api.post<AuthResponse>` |

---

## 파일별 책임 (SRP)

| 파일 | 단일 책임 | 변경 시점 |
|------|----------|----------|
| `api.ts` | HTTP 인프라 설정 | API URL 변경, 인증 방식 변경 |
| `authService.ts` | Auth API 엔드포인트 호출 | Auth 엔드포인트 변경, 새 인증 기능 |
