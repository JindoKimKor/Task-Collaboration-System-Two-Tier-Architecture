# Design Patterns & SOLID Principles in Google Sign-In Button

## GoF Design Patterns Applied

### 1. Provider Pattern (React Context)

```mermaid
flowchart TB
    subgraph PROVIDER["Provider Pattern"]
        direction TB

        GOP["GoogleOAuthProvider<br/>─────────────<br/>Context Provider"]

        subgraph CONSUMERS["Consumer Components"]
            LP["LoginPage"]
            GSB["GoogleSignInButton"]
            GL["GoogleLogin"]
        end
    end

    GOP -->|"provides context"| CONSUMERS
```

**Where:** `GoogleOAuthProvider` in App.tsx

**Why Provider Pattern:**
- SDK 초기화를 한 곳에서 관리
- 하위 컴포넌트에서 설정 없이 사용 가능
- Client ID를 props drilling 없이 전달

```tsx
// App.tsx - Provider
<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <AppRouter />
</GoogleOAuthProvider>

// GoogleSignInButton - Consumer (자동으로 context 사용)
<GoogleLogin onSuccess={...} />
```

---

### 2. Container/Presentational Pattern

```mermaid
flowchart TB
    subgraph PATTERN["Container/Presentational"]
        direction TB

        subgraph CONTAINER["Container: GoogleSignInButton"]
            C1["dispatch 호출"]
            C2["navigate 처리"]
            C3["에러 핸들링"]
        end

        subgraph PRESENTATIONAL["Presentational: GoogleLogin"]
            P1["버튼 렌더링"]
            P2["팝업 표시"]
            P3["콜백 호출"]
        end
    end

    CONTAINER -->|"renders"| PRESENTATIONAL
```

**Where:** GoogleSignInButton wraps GoogleLogin

**Why:**
- GoogleLogin: UI만 담당 (라이브러리 제공)
- GoogleSignInButton: 비즈니스 로직 담당 (우리 코드)

---

### 3. Facade Pattern

```mermaid
flowchart TB
    subgraph FACADE["Facade Pattern"]
        direction TB

        CLIENT["GoogleSignInButton"]

        subgraph SIMPLE["Simple Interface"]
            GSB["googleLogin(idToken)"]
        end

        subgraph COMPLEX["Complex Subsystem"]
            T["Thunk dispatch"]
            S["Service call"]
            LS["localStorage"]
            R["Redux update"]
        end
    end

    CLIENT --> SIMPLE --> COMPLEX
```

**Where:** googleLogin thunk

**Why Facade:**
- 컴포넌트는 `dispatch(googleLogin(credential))` 만 호출
- API 호출, localStorage, Redux 업데이트는 내부에서 처리

---

### 4. Observer Pattern (Redux)

```mermaid
flowchart TB
    subgraph OBSERVER["Observer Pattern"]
        direction TB

        STORE["Redux Store<br/>─────────────<br/>Subject"]

        subgraph OBSERVERS["Observers"]
            LP["LoginPage<br/>useAppSelector"]
            OTHER["Other Components"]
        end
    end

    STORE -->|"notify on change"| OBSERVERS
```

**Where:** LoginPage subscribes to auth state

**Why Observer:**
- `isAuthenticated` 변경 시 자동 리렌더링
- useEffect에서 감지하여 navigate

```tsx
const { isAuthenticated } = useAppSelector((state) => state.auth);

useEffect(() => {
  if (isAuthenticated) {
    navigate("/board");
  }
}, [isAuthenticated]);
```

---

### 5. Strategy Pattern

```mermaid
flowchart TB
    subgraph STRATEGY["Strategy Pattern"]
        direction TB

        CONTEXT["LoginPage<br/>─────────────<br/>Context"]

        subgraph STRATEGIES["Login Strategies"]
            S1["Password Strategy<br/>LoginForm + login thunk"]
            S2["Google Strategy<br/>GoogleSignInButton + googleLogin thunk"]
        end
    end

    CONTEXT --> STRATEGIES
```

**Where:** LoginPage with two login methods

**Why Strategy:**
- 동일한 목적 (로그인) 달성
- 다른 구현 방법 (password vs Google)
- 런타임에 사용자가 선택

---

## SOLID Principles Applied

### S - Single Responsibility Principle (SRP)

```mermaid
flowchart TB
    subgraph SRP["Single Responsibility"]
        direction LR

        subgraph COMP["GoogleSignInButton"]
            C1["Google 로그인 UI + 로직<br/>─────────────<br/>한 가지 역할"]
        end

        subgraph SERVICE["authService.googleLogin"]
            S1["API 호출만<br/>─────────────<br/>한 가지 역할"]
        end

        subgraph THUNK["googleLogin thunk"]
            T1["비동기 흐름 관리<br/>─────────────<br/>한 가지 역할"]
        end
    end
```

| Component | Single Responsibility |
|-----------|----------------------|
| GoogleSignInButton | Google 로그인 UI 렌더링 |
| googleLogin thunk | 비동기 흐름 (API → localStorage → Redux) |
| authService.googleLogin | HTTP POST 요청만 |
| authSlice | 상태 변경만 |

---

### O - Open/Closed Principle (OCP)

```mermaid
flowchart TB
    subgraph OCP["Open/Closed"]
        direction TB

        subgraph CLOSED["Closed for Modification"]
            LP["LoginPage<br/>─────────────<br/>기존 로그인 코드 변경 없음"]
        end

        subgraph OPEN["Open for Extension"]
            NEW["GoogleSignInButton 추가"]
        end
    end

    OPEN -->|"extends"| CLOSED
```

**Where Applied:**
- LoginPage에 GoogleSignInButton 추가만으로 확장
- 기존 LoginForm 코드 수정 없음
- 추후 Facebook, Apple 로그인도 같은 방식으로 추가 가능

---

### L - Liskov Substitution Principle (LSP)

```mermaid
flowchart TB
    subgraph LSP["Liskov Substitution"]
        direction TB

        INTERFACE["Login Result<br/>─────────────<br/>{ token, user }"]

        subgraph IMPLEMENTATIONS["Any login method works"]
            L1["login thunk"]
            L2["googleLogin thunk"]
            L3["appleLogin (future)"]
        end
    end

    IMPLEMENTATIONS -->|"returns"| INTERFACE
```

**Where Applied:**
- 모든 로그인 방식이 동일한 AuthResponse 반환
- authSlice는 어떤 로그인인지 모르고 동일하게 처리
- 교체 가능 (Substitutable)

---

### I - Interface Segregation Principle (ISP)

```mermaid
flowchart TB
    subgraph ISP["Interface Segregation"]
        direction TB

        subgraph SEPARATED["Separated Concerns"]
            I1["authService.login()"]
            I2["authService.googleLogin()"]
            I3["authService.register()"]
        end
    end
```

**Where Applied:**
- 각 메서드가 독립적
- googleLogin은 login 코드에 의존하지 않음
- 필요한 것만 import

---

### D - Dependency Inversion Principle (DIP)

```mermaid
flowchart TB
    subgraph DIP["Dependency Inversion"]
        direction TB

        subgraph HIGH["High-Level"]
            GSB["GoogleSignInButton"]
        end

        subgraph ABSTRACTION["Abstraction"]
            THUNK["googleLogin thunk<br/>(interface)"]
        end

        subgraph LOW["Low-Level"]
            SERVICE["authService"]
            AXIOS["axios instance"]
        end
    end

    GSB -->|"depends on"| THUNK
    THUNK -->|"uses"| SERVICE
    SERVICE -->|"uses"| AXIOS
```

**Where Applied:**
- GoogleSignInButton은 authService 직접 호출 안 함
- thunk 추상화 계층을 통해 호출
- 테스트 시 thunk만 mock 가능

---

## Summary Table

| Pattern/Principle | Where Applied | Benefit |
|-------------------|---------------|---------|
| **Provider** | GoogleOAuthProvider | SDK 설정 중앙화 |
| **Container/Presentational** | GoogleSignInButton/GoogleLogin | 관심사 분리 |
| **Facade** | googleLogin thunk | 복잡성 숨김 |
| **Observer** | Redux subscription | 자동 UI 업데이트 |
| **Strategy** | Password/Google login | 교체 가능한 로그인 |
| **SRP** | Each file | 한 가지 역할만 |
| **OCP** | Adding GoogleSignInButton | 확장에 열림 |
| **LSP** | AuthResponse | 교체 가능 |
| **ISP** | Separate service methods | 독립적 인터페이스 |
| **DIP** | Component → Thunk → Service | 추상화 의존 |

---

## Related Documentation

- [00-development-plan.md](./00-development-plan.md) - 구현 계획
- [01-architecture-diagram.md](./01-architecture-diagram.md) - 시스템 아키텍처
- [03-programming-concepts.md](./03-programming-concepts.md) - 프로그래밍 개념
