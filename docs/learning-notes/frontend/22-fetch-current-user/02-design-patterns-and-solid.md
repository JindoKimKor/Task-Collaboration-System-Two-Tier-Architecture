# Design Patterns & SOLID Principles

## Overview

Task #22 fetchCurrentUser 구현에서 사용된 디자인 패턴과 SOLID 원칙

---

## 1. Design Patterns

### 1.1 Container Pattern (계획됨)

```mermaid
graph TB
    subgraph Container["Container (App.tsx)"]
        D[dispatch]
        S[useAppSelector]
        E[useEffect]
    end

    subgraph Presentational["Presentational (AppRouter)"]
        R[라우팅만 담당]
        P[props로 데이터 받음]
    end

    Container -->|렌더링| Presentational
```

**적용:**
- App.tsx = Container (상태 로직)
- AppRouter = Presentational (UI 라우팅)

---

### 1.2 Service Layer Pattern

```mermaid
graph TB
    subgraph Component["Component Layer"]
        T[fetchCurrentUser Thunk]
    end

    subgraph Service["Service Layer"]
        AS[authService.fetchCurrentUser]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        API[Axios api instance]
    end

    subgraph External["External"]
        BE[Backend /auth/me]
    end

    T --> AS
    AS --> API
    API --> BE
```

**장점:**
- Thunk가 HTTP 세부사항 모름
- Service 교체 가능 (테스트 시 Mock)
- 관심사 분리

---

### 1.3 Interceptor Pattern

```mermaid
sequenceDiagram
    participant C as Component
    participant I as Interceptor
    participant S as Server

    C->>I: request
    Note over I: 요청 가로채기<br/>Authorization 헤더 추가
    I->>S: modified request
    S-->>I: response
    Note over I: 응답 가로채기<br/>(필요시 변환)
    I-->>C: modified response
```

**적용:**
- Axios request interceptor가 모든 요청에 token 자동 추가
- 횡단 관심사 (Cross-cutting Concern) 처리

---

### 1.4 Thunk Pattern (Redux Middleware)

```mermaid
graph LR
    A[dispatch action] --> B{Thunk?}
    B -->|Yes| C[Middleware 실행<br/>비동기 처리]
    B -->|No| D[Reducer로 직행]
    C --> E[pending]
    C --> F[fulfilled/rejected]
    E --> D
    F --> D
```

**역할:**
- 비동기 로직을 액션으로 캡슐화
- 컴포넌트는 `dispatch(fetchCurrentUser())`만 호출
- 복잡한 비동기 로직 숨김

---

## 2. SOLID Principles

### 2.1 Single Responsibility Principle (SRP)

```mermaid
graph TB
    subgraph 각_파일의_단일_책임["각 파일의 단일 책임"]
        A[api.types.ts<br/>타입 정의만]
        B[authService.ts<br/>API 호출만]
        C[authThunks.ts<br/>비동기 액션만]
        D[authSlice.ts<br/>상태 관리만]
    end
```

| 파일 | 책임 |
|------|------|
| api.types.ts | UserResponse 타입 정의 |
| authService.ts | /auth/me HTTP 호출 |
| authThunks.ts | 비동기 흐름 관리 |
| authSlice.ts | 상태 변경 로직 |

---

### 2.2 Open/Closed Principle (OCP)

```mermaid
graph TB
    subgraph 확장에_열림["확장에 열림"]
        T1[register thunk]
        T2[login thunk]
        T3[fetchCurrentUser thunk<br/>새로 추가!]
    end

    subgraph 수정에_닫힘["수정에 닫힘"]
        S[authSlice.ts<br/>builder 패턴으로 추가만]
    end

    T3 -->|addCase| S
```

**적용:**
- 새 thunk 추가 시 기존 코드 수정 불필요
- `builder.addCase()`로 새 케이스만 추가

```typescript
// 기존 코드 수정 없이 확장
builder
  .addCase(register.pending, ...)
  .addCase(login.pending, ...)
  .addCase(fetchCurrentUser.pending, ...)  // 추가만!
```

---

### 2.3 Dependency Inversion Principle (DIP)

```mermaid
graph TB
    subgraph High_Level["High Level (Thunk)"]
        T[fetchCurrentUser]
    end

    subgraph Abstraction["Abstraction"]
        AS[authService 인터페이스]
    end

    subgraph Low_Level["Low Level"]
        IMPL[authService 구현<br/>Axios 사용]
    end

    T -->|의존| AS
    IMPL -->|구현| AS
```

**효과:**
- Thunk는 authService 인터페이스에만 의존
- 실제 HTTP 라이브러리(Axios) 교체 가능
- 테스트 시 Mock 주입 용이

---

## 3. 적용된 패턴 요약

```mermaid
graph TB
    subgraph Patterns["적용된 패턴"]
        P1[Container Pattern<br/>상태 로직 분리]
        P2[Service Layer<br/>API 호출 캡슐화]
        P3[Interceptor<br/>횡단 관심사]
        P4[Thunk<br/>비동기 액션]
    end

    subgraph SOLID["SOLID 원칙"]
        S1[SRP<br/>파일별 단일 책임]
        S2[OCP<br/>builder 패턴 확장]
        S3[DIP<br/>Service 추상화]
    end
```

---

## 4. 코드 품질 체크리스트

| 항목 | 상태 | 설명 |
|------|------|------|
| 파일 분리 | ✅ | types, service, thunk, slice 분리 |
| 단일 책임 | ✅ | 각 파일 하나의 역할 |
| 확장 용이 | ✅ | 새 thunk 추가 쉬움 |
| 테스트 용이 | ✅ | Service Mock 가능 |
| 재사용성 | ✅ | fetchCurrentUser 어디서든 호출 가능 |
