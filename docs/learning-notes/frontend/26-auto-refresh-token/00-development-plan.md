# Auto Refresh Token Implementation Plan

## Overview

Task #26: Frontend에서 Access Token 만료 시 자동으로 Refresh Token을 사용하여 새 토큰을 발급받고 원래 요청을 재시도하는 기능 구현

---

## 현재 구현 상태

| 항목 | 상태 | 설명 |
|------|------|------|
| refreshToken localStorage 저장 | ✅ 완료 | authThunks.ts (login, register, googleLogin) |
| logout 시 refreshToken 삭제 | ✅ 완료 | authSlice.ts |
| Response Interceptor 구현 | ✅ 완료 | api.ts |
| fetchCurrentUser refreshToken 삭제 | ✅ 완료 | authThunks.ts |
| 빌드 테스트 | ✅ 완료 | npm run build |
| E2E 테스트 | ✅ 완료 | 401 → refresh → 재시도 확인 |

---

## 문제 상황

### Access Token 만료 시 문제

```mermaid
graph TB
    subgraph 기존_방식["기존 방식 (Task #22)"]
        E1[Access Token 만료]
        E2[401 Unauthorized]
        E3[Token 삭제]
        E4[로그인 페이지로 이동]
        E5[사용자 불편!]

        E1 --> E2 --> E3 --> E4 --> E5
    end

    subgraph 새_방식["새 방식 (Task #26)"]
        N1[Access Token 만료]
        N2[401 Unauthorized]
        N3[Refresh Token으로 새 토큰 요청]
        N4[새 토큰 저장]
        N5[원래 요청 재시도]
        N6[사용자는 모름!]

        N1 --> N2 --> N3 --> N4 --> N5 --> N6
    end
```

**결과:** 사용자는 토큰 만료를 인지하지 못하고 계속 사용 가능

---

## 해결 방법

### Axios Response Interceptor

```mermaid
sequenceDiagram
    participant C as Component
    participant API as api.ts
    participant BE as Backend
    participant LS as localStorage

    C->>API: GET /auth/me (만료된 token)
    API->>BE: Request
    BE-->>API: 401 Unauthorized

    Note over API: Response Interceptor 감지

    API->>LS: getItem("refreshToken")
    LS-->>API: refreshToken exists

    API->>BE: POST /auth/refresh { refreshToken }
    BE-->>API: { token, refreshToken }

    API->>LS: setItem("token", newToken)
    API->>LS: setItem("refreshToken", newRefreshToken)

    API->>BE: GET /auth/me (새 token)
    BE-->>API: 200 OK { user }

    API-->>C: Success!
```

---

## File Structure

```
src/
├── services/
│   └── api.ts                    ← Response Interceptor 추가 ✅
├── features/auth/
│   ├── store/
│   │   ├── authSlice.ts          ← logout에서 refreshToken 삭제 ✅
│   │   └── authThunks.ts         ← refreshToken 저장/삭제 ✅
│   └── types/
│       └── api.types.ts          ← AuthResponse (이미 refreshToken 포함)
```

---

## Implementation Details

### 1. refreshToken 저장 (authThunks.ts)

모든 인증 성공 시 refreshToken도 localStorage에 저장

```typescript
// login, register, googleLogin thunks
const response = await authService.login(data);
localStorage.setItem("token", response.token);
localStorage.setItem("refreshToken", response.refreshToken);  // 추가
```

**적용 위치:**
- `register` thunk
- `login` thunk
- `googleLogin` thunk

---

### 2. refreshToken 삭제 (authSlice.ts)

로그아웃 시 refreshToken도 삭제

```typescript
logout: (state) => {
  state.user = null;
  state.token = null;
  state.isAuthenticated = false;
  state.error = null;
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");  // 추가
},
```

---

### 3. Response Interceptor (api.ts)

401 에러 감지 → 자동 refresh → 원래 요청 재시도

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 조건: 401 + 재시도 안함 + refresh 요청 아님
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        // refreshToken 없으면 로그아웃
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // 새 토큰 요청 (axios 직접 사용 - 무한루프 방지)
        const response = await axios.post<AuthResponse>(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        // 새 토큰 저장
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("refreshToken", response.data.refreshToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // refresh 실패 시 로그아웃
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

### 4. fetchCurrentUser에서 refreshToken 삭제 (authThunks.ts)

401 에러 시 refreshToken도 함께 삭제

```typescript
catch (error: unknown) {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");  // 추가
  // ...
}
```

---

## Data Flow

### 정상 흐름 (토큰 갱신 성공)

```mermaid
sequenceDiagram
    participant C as Component
    participant T as Thunk
    participant I as Response Interceptor
    participant BE as Backend
    participant LS as localStorage

    C->>T: dispatch(someAction())
    T->>BE: GET /api/something (만료된 token)
    BE-->>I: 401 Unauthorized

    Note over I: 401 감지, _retry=true 설정

    I->>LS: getItem("refreshToken")
    LS-->>I: "abc123..."

    I->>BE: POST /auth/refresh
    BE-->>I: { token: "new...", refreshToken: "new..." }

    I->>LS: setItem("token", newToken)
    I->>LS: setItem("refreshToken", newRefreshToken)

    I->>BE: GET /api/something (새 token)
    BE-->>I: 200 OK { data }

    I-->>T: response
    T-->>C: Success!
```

### 실패 흐름 (Refresh Token도 만료)

```mermaid
sequenceDiagram
    participant C as Component
    participant I as Response Interceptor
    participant BE as Backend
    participant LS as localStorage
    participant B as Browser

    C->>BE: GET /api/something (만료된 token)
    BE-->>I: 401 Unauthorized

    I->>LS: getItem("refreshToken")
    LS-->>I: "expired_refresh..."

    I->>BE: POST /auth/refresh
    BE-->>I: 401 Unauthorized (refresh도 만료)

    Note over I: catch 블록 실행

    I->>LS: removeItem("token")
    I->>LS: removeItem("refreshToken")
    I->>B: window.location.href = "/login"

    Note over B: 로그인 페이지로 이동
```

---

## 무한 루프 방지 전략

### 문제: Refresh 요청도 401이면?

```mermaid
graph TB
    subgraph 문제["문제: 무한 루프"]
        P1[요청 → 401]
        P2[refresh 호출 → 401]
        P3[refresh 호출 → 401]
        P4[무한 반복!]

        P1 --> P2 --> P3 --> P4
    end

    subgraph 해결["해결: 3가지 조건"]
        S1["1. _retry 플래그<br/>재시도 여부 체크"]
        S2["2. URL 체크<br/>/auth/refresh 제외"]
        S3["3. axios 직접 사용<br/>interceptor 우회"]
    end
```

### 조건 코드

```typescript
if (
  error.response?.status === 401 &&      // 1. 401 에러
  !originalRequest._retry &&              // 2. 아직 재시도 안 함
  !originalRequest.url?.includes("/auth/refresh")  // 3. refresh 요청 아님
)
```

### axios vs api 사용

```typescript
// ❌ 잘못된 방법 (무한 루프 위험)
const response = await api.post("/auth/refresh", { refreshToken });

// ✅ 올바른 방법 (interceptor 우회)
const response = await axios.post(
  `${api.defaults.baseURL}/auth/refresh`,
  { refreshToken }
);
```

---

## Token Rotation (토큰 회전)

### 매 Refresh마다 새 Refresh Token 발급

```mermaid
graph LR
    subgraph Before["Refresh 전"]
        B1[Access Token A<br/>만료됨]
        B2[Refresh Token R1<br/>유효]
    end

    subgraph After["Refresh 후"]
        A1[Access Token B<br/>새로 발급]
        A2[Refresh Token R2<br/>새로 발급]
    end

    subgraph Old["이전 토큰"]
        O1[R1 → 서버에서 삭제됨]
    end

    Before -->|POST /auth/refresh| After
    B2 -.->|무효화| O1
```

**보안 이점:**
- Refresh Token 탈취 시 한 번만 사용 가능
- 정상 사용자가 다음 refresh 시 탈취 감지 가능

---

## Checklist

- [x] login thunk에서 refreshToken 저장
- [x] register thunk에서 refreshToken 저장
- [x] googleLogin thunk에서 refreshToken 저장
- [x] logout에서 refreshToken 삭제
- [x] Response Interceptor 구현
- [x] 무한 루프 방지 로직
- [x] fetchCurrentUser에서 refreshToken 삭제
- [x] Build verification (npm run build)
- [x] E2E test (Network tab: 401 → refresh → 200)

---

## Related Documentation

- [01-interceptor-flow.md](./01-interceptor-flow.md) - Interceptor 상세 동작
- [02-design-patterns-and-solid.md](./02-design-patterns-and-solid.md) - 디자인 패턴
- [03-programming-concepts.md](./03-programming-concepts.md) - 프로그래밍 개념
