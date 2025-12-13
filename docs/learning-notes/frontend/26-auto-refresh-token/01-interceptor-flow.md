# Axios Interceptor: Request vs Response

## Overview

Axios Interceptor는 HTTP 요청/응답을 가로채서 공통 로직을 처리하는 미들웨어 패턴

---

## 1. 두 종류의 Interceptor

```mermaid
graph LR
    subgraph Client["Client"]
        C[Component]
    end

    subgraph Interceptors["Axios Interceptors"]
        REQ[Request Interceptor<br/>요청 전 처리]
        RES[Response Interceptor<br/>응답 후 처리]
    end

    subgraph Server["Server"]
        S[Backend API]
    end

    C -->|1. 요청| REQ
    REQ -->|2. 수정된 요청| S
    S -->|3. 응답| RES
    RES -->|4. 수정된 응답| C
```

---

## 2. Request Interceptor (기존)

### 역할: 모든 요청에 Token 자동 추가

```mermaid
sequenceDiagram
    participant C as Component
    participant RI as Request Interceptor
    participant LS as localStorage
    participant S as Server

    C->>RI: GET /api/tasks
    RI->>LS: getItem("token")
    LS-->>RI: "eyJhbG..."

    Note over RI: Header 추가<br/>Authorization: Bearer eyJhbG...

    RI->>S: GET /api/tasks<br/>+ Authorization header
    S-->>C: Response
```

### 코드

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 장점

| 기존 방식 | Interceptor 방식 |
|-----------|------------------|
| 매 요청마다 token 추가 | 한 번 설정으로 모든 요청에 적용 |
| 중복 코드 | 중앙 집중 관리 |
| 실수 가능성 높음 | 일관성 보장 |

---

## 3. Response Interceptor (Task #26 추가)

### 역할: 401 에러 감지 → 자동 Token Refresh

```mermaid
sequenceDiagram
    participant C as Component
    participant RI as Response Interceptor
    participant LS as localStorage
    participant S as Server

    C->>S: GET /api/tasks (만료된 token)
    S-->>RI: 401 Unauthorized

    Note over RI: 401 감지!<br/>Refresh 시도

    RI->>LS: getItem("refreshToken")
    LS-->>RI: "abc123..."

    RI->>S: POST /auth/refresh
    S-->>RI: { token, refreshToken }

    RI->>LS: setItem("token", newToken)
    RI->>LS: setItem("refreshToken", newRefresh)

    Note over RI: 원래 요청 재시도

    RI->>S: GET /api/tasks (새 token)
    S-->>RI: 200 OK { data }

    RI-->>C: Success (사용자는 401 모름!)
```

### 코드 구조

```typescript
api.interceptors.response.use(
  // 성공 응답: 그대로 통과
  (response) => response,

  // 에러 응답: 401이면 refresh 시도
  async (error) => {
    const originalRequest = error.config;

    if (shouldAttemptRefresh(error, originalRequest)) {
      return attemptTokenRefresh(originalRequest);
    }

    return Promise.reject(error);
  }
);
```

---

## 4. Response Interceptor 상세 흐름

### 조건 체크

```mermaid
flowchart TB
    Start[에러 발생]
    C1{401 에러?}
    C2{이미 재시도?}
    C3{refresh 요청?}
    C4{refreshToken 있음?}

    Refresh[Token Refresh 시도]
    Reject[에러 그대로 반환]
    Logout[로그아웃 처리]

    Start --> C1
    C1 -->|No| Reject
    C1 -->|Yes| C2
    C2 -->|Yes _retry=true| Reject
    C2 -->|No| C3
    C3 -->|Yes /auth/refresh| Reject
    C3 -->|No| C4
    C4 -->|No| Logout
    C4 -->|Yes| Refresh
```

### 각 조건의 의미

| 조건 | 목적 |
|------|------|
| `error.response?.status === 401` | 인증 실패만 처리 |
| `!originalRequest._retry` | 무한 루프 방지 (한 번만 재시도) |
| `!originalRequest.url?.includes("/auth/refresh")` | refresh 요청 자체는 재시도 안 함 |
| `refreshToken` 존재 여부 | 갱신 가능 여부 확인 |

---

## 5. originalRequest._retry 플래그

### 왜 필요한가?

```mermaid
graph TB
    subgraph Without_Retry["_retry 없이"]
        W1[요청 → 401]
        W2[refresh → 실패]
        W3[요청 → 401]
        W4[refresh → 실패]
        W5[무한 반복!]

        W1 --> W2 --> W3 --> W4 --> W5
    end

    subgraph With_Retry["_retry 사용"]
        R1[요청 → 401]
        R2["_retry = true"]
        R3[refresh 시도]
        R4{성공?}
        R5[원래 요청 재시도]
        R6[로그아웃]

        R1 --> R2 --> R3 --> R4
        R4 -->|Yes| R5
        R4 -->|No| R6
    end
```

### 코드

```typescript
// 첫 번째 401에서
originalRequest._retry = true;  // 플래그 설정

// 두 번째 401에서
if (!originalRequest._retry) {  // false이므로 재시도 안 함
  // 이 블록 실행 안 됨
}
```

---

## 6. axios vs api 사용 이유

### 문제: api 인스턴스로 refresh 요청 시

```mermaid
graph TB
    subgraph Problem["문제: api 사용"]
        P1[refresh 요청]
        P2[Request Interceptor<br/>만료된 token 추가]
        P3[서버: 401]
        P4[Response Interceptor<br/>또 refresh 시도]
        P5[무한 루프!]

        P1 --> P2 --> P3 --> P4 --> P5
    end
```

### 해결: axios 직접 사용

```mermaid
graph TB
    subgraph Solution["해결: axios 직접 사용"]
        S1[refresh 요청]
        S2[Interceptor 우회]
        S3[서버: 새 토큰 반환]
        S4[성공!]

        S1 --> S2 --> S3 --> S4
    end
```

### 코드 비교

```typescript
// ❌ 잘못된 방법
const response = await api.post("/auth/refresh", { refreshToken });
// → Request Interceptor가 만료된 token을 추가함

// ✅ 올바른 방법
const response = await axios.post(
  `${api.defaults.baseURL}/auth/refresh`,
  { refreshToken }
);
// → Interceptor 완전 우회, refreshToken만 전송
```

---

## 7. window.location.href vs Redux

### 왜 Redux dispatch를 안 쓰나?

```mermaid
graph TB
    subgraph Interceptor["api.ts (Interceptor)"]
        I1[Response Interceptor]
        I2[Redux Store 접근 불가!]
        I3[순수 JavaScript 영역]
    end

    subgraph Redux["Redux"]
        R1[store]
        R2[dispatch]
        R3[logout action]
    end

    I1 -.->|접근 불가| Redux
    I1 -->|가능| window.location
```

### 이유

| 방법 | 문제점 |
|------|--------|
| Redux dispatch | api.ts에서 store import 시 순환 의존성 |
| window.location.href | 간단하고 확실한 리다이렉트 |

### 대안: Event 기반 (고급)

```typescript
// api.ts
window.dispatchEvent(new CustomEvent('auth:logout'));

// App.tsx
useEffect(() => {
  const handleLogout = () => dispatch(logout());
  window.addEventListener('auth:logout', handleLogout);
  return () => window.removeEventListener('auth:logout', handleLogout);
}, []);
```

---

## 8. 두 Interceptor 비교

| 항목 | Request Interceptor | Response Interceptor |
|------|---------------------|----------------------|
| 실행 시점 | 요청 전 | 응답 후 |
| 주요 역할 | Token 추가 | 에러 처리 |
| Task | 기존 | Task #26 추가 |
| 처리 대상 | 모든 요청 | 401 에러만 |

---

## 9. 전체 흐름 요약

```mermaid
sequenceDiagram
    participant C as Component
    participant REQ as Request Interceptor
    participant S as Server
    participant RES as Response Interceptor
    participant LS as localStorage

    Note over C,LS: 정상 요청

    C->>REQ: API 요청
    REQ->>LS: getItem("token")
    REQ->>S: + Authorization header
    S-->>RES: 200 OK
    RES-->>C: 응답 전달

    Note over C,LS: 토큰 만료 시

    C->>REQ: API 요청
    REQ->>LS: getItem("token")
    REQ->>S: + 만료된 token
    S-->>RES: 401 Unauthorized

    RES->>LS: getItem("refreshToken")
    RES->>S: POST /auth/refresh (axios 직접)
    S-->>RES: 새 토큰들
    RES->>LS: 새 토큰 저장

    RES->>S: 원래 요청 재시도
    S-->>RES: 200 OK
    RES-->>C: 응답 전달 (401 숨김)
```

---

## 10. 핵심 포인트

1. **Request Interceptor**: 모든 요청에 token 자동 추가
2. **Response Interceptor**: 401 감지 → 자동 refresh → 재시도
3. **_retry 플래그**: 무한 루프 방지
4. **axios 직접 사용**: Interceptor 우회하여 refresh 요청
5. **window.location**: Redux 외부에서 리다이렉트
