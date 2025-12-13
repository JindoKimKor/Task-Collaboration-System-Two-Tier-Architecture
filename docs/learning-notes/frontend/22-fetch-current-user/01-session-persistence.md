# Session Persistence: 세션 유지 전략

## Overview

웹 애플리케이션에서 브라우저 새로고침 후에도 로그인 상태를 유지하는 방법

---

## 1. 메모리 vs 영구 저장소

```mermaid
graph TB
    subgraph Memory["메모리 (휘발성)"]
        RS[Redux Store<br/>JavaScript 변수]
    end

    subgraph Storage["영구 저장소 (비휘발성)"]
        LS[localStorage<br/>브라우저 디스크]
        SS[sessionStorage<br/>브라우저 탭]
        CK[Cookie<br/>브라우저 + 서버]
    end

    RefreshEvent[새로고침 F5]

    RS -->|초기화됨| RefreshEvent
    LS -->|유지됨| RefreshEvent
    SS -->|유지됨| RefreshEvent
    CK -->|유지됨| RefreshEvent
```

### 비교 표

| 저장소 | 지속성 | 탭 공유 | 서버 전송 | 용량 |
|--------|--------|---------|----------|------|
| Redux Store | 새로고침 시 초기화 | ❌ | ❌ | 무제한 |
| localStorage | 브라우저 닫아도 유지 | ✅ | ❌ | ~5MB |
| sessionStorage | 탭 닫으면 삭제 | ❌ | ❌ | ~5MB |
| Cookie | 만료일까지 유지 | ✅ | ✅ | ~4KB |

---

## 2. 이 프로젝트의 전략

### Token은 localStorage, User는 API에서

```mermaid
graph TB
    subgraph 로그인_성공["로그인 성공 시"]
        L1[1. API 응답: token + user]
        L2[2. token → localStorage]
        L3[3. user → Redux Store]
    end

    subgraph 새로고침_후["새로고침 후"]
        R1[1. localStorage에서 token 확인]
        R2[2. token 있으면 /auth/me 호출]
        R3[3. API 응답 → Redux Store 복원]
    end

    L1 --> L2
    L2 --> L3
    L3 -->|F5| R1
    R1 --> R2
    R2 --> R3
```

### 왜 user 정보는 localStorage에 저장 안 하나?

```mermaid
graph LR
    subgraph 방법1["방법 1: localStorage에 user 저장"]
        A1[장점: API 호출 불필요]
        A2[단점: 정보 불일치 가능]
        A3[단점: XSS 취약]
    end

    subgraph 방법2["방법 2: API에서 user 조회"]
        B1[장점: 항상 최신 정보]
        B2[장점: 서버가 토큰 검증]
        B3[단점: 추가 API 호출]
    end

    방법2 -->|이 프로젝트| Selected[선택됨]
```

**이유:**
1. **보안**: 서버가 토큰 유효성 검증
2. **정확성**: 사용자 정보가 변경되었을 수 있음 (이름, 역할 등)
3. **단순성**: localStorage는 token만 관리

---

## 3. Token 기반 인증 흐름

```mermaid
sequenceDiagram
    participant C as Client
    participant LS as localStorage
    participant S as Server

    Note over C,S: 최초 로그인

    C->>S: POST /auth/login { email, password }
    S-->>C: { token, user }
    C->>LS: setItem("token", token)
    C->>C: Redux: user, isAuthenticated=true

    Note over C,S: 새로고침 후 세션 복원

    C->>LS: getItem("token")
    LS-->>C: token exists
    C->>S: GET /auth/me (Header: Authorization: Bearer token)
    S->>S: Token 검증

    alt Token Valid
        S-->>C: { id, name, email, ... }
        C->>C: Redux: user 복원, isAuthenticated=true
    else Token Invalid
        S-->>C: 401 Unauthorized
        C->>LS: removeItem("token")
        C->>C: Redux: 로그아웃 상태
    end
```

---

## 4. Axios Interceptor의 역할

### 모든 요청에 Token 자동 추가

```mermaid
graph LR
    subgraph Request["API 요청"]
        R1[GET /auth/me]
        R2[GET /tasks]
        R3[POST /tasks]
    end

    subgraph Interceptor["Axios Interceptor"]
        I1["localStorage.getItem('token')"]
        I2["Header: Authorization: Bearer {token}"]
    end

    subgraph Server["서버"]
        S1[요청 수신]
    end

    R1 --> I1
    R2 --> I1
    R3 --> I1
    I1 --> I2
    I2 --> S1
```

### 코드 위치

```typescript
// src/services/api.ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**장점:**
- 매 요청마다 token 추가 코드 불필요
- 중앙 집중식 관리
- 인증 로직 일관성

---

## 5. 토큰 만료 처리

```mermaid
graph TB
    Start[fetchCurrentUser 호출]
    Check{토큰 유효?}
    Valid[200 OK<br/>세션 복원]
    Invalid[401 Unauthorized]
    Remove[localStorage.removeItem token]
    Logout[isAuthenticated = false<br/>로그인 페이지로]

    Start --> Check
    Check -->|Yes| Valid
    Check -->|No| Invalid
    Invalid --> Remove
    Remove --> Logout
```

### 토큰이 무효화되는 경우

| 상황 | 서버 응답 | 클라이언트 처리 |
|------|----------|----------------|
| 토큰 만료 | 401 | token 삭제, 재로그인 유도 |
| 토큰 변조 | 401 | token 삭제, 재로그인 유도 |
| 사용자 삭제됨 | 404 또는 401 | token 삭제, 재로그인 유도 |

---

## 6. 언제 fetchCurrentUser가 호출되나?

```mermaid
graph TB
    Start[앱 시작]
    HasToken{localStorage에<br/>token 있음?}
    IsAuth{이미<br/>인증됨?}
    Fetch[fetchCurrentUser 호출]
    Skip[건너뜀]
    Render[AppRouter 렌더링]

    Start --> HasToken
    HasToken -->|No| Skip
    HasToken -->|Yes| IsAuth
    IsAuth -->|Yes| Skip
    IsAuth -->|No| Fetch
    Fetch --> Render
    Skip --> Render
```

### 조건: `token && !isAuthenticated`

| token | isAuthenticated | 결과 |
|-------|-----------------|------|
| ❌ | ❌ | 건너뜀 (비로그인 상태) |
| ✅ | ❌ | **호출** (복원 필요) |
| ✅ | ✅ | 건너뜀 (이미 인증됨) |

---

## 7. 요약

```mermaid
graph TB
    subgraph 저장_전략["저장 전략"]
        T[Token → localStorage<br/>영구 저장, 새로고침 유지]
        U[User → Redux Store<br/>API에서 조회]
    end

    subgraph 복원_전략["복원 전략"]
        R1[앱 시작]
        R2[token 확인]
        R3[/auth/me 호출]
        R4[Redux 복원]
    end

    T --> R1
    R1 --> R2
    R2 --> R3
    R3 --> R4

    style T fill:#87CEEB
    style U fill:#87CEEB
```

### 핵심 포인트

1. **localStorage**: token만 저장 (영구)
2. **Redux Store**: user 정보 저장 (휘발)
3. **세션 복원**: token으로 서버에 user 정보 요청
4. **Interceptor**: 모든 요청에 token 자동 추가
5. **토큰 만료**: 401 시 자동 로그아웃 처리
