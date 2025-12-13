# Google Sign-In Button Architecture Diagram

## System Architecture

```mermaid
flowchart TB
    subgraph FRONTEND["Frontend (React)"]
        direction TB

        subgraph PROVIDER["App.tsx"]
            GOP["GoogleOAuthProvider<br/>─────────────<br/>clientId from .env"]
        end

        subgraph LOGINPAGE["LoginPage"]
            LF["LoginForm"]
            GSB["GoogleSignInButton"]
        end

        subgraph REDUX["Redux Store"]
            direction TB
            THUNK["googleLogin Thunk"]
            SLICE["authSlice<br/>─────────────<br/>extraReducers"]
        end

        subgraph SERVICE["Service Layer"]
            AS["authService.googleLogin()"]
        end
    end

    subgraph EXTERNAL["External"]
        GOOGLE["Google OAuth<br/>─────────────<br/>Popup Login"]
        BACKEND["Backend API<br/>─────────────<br/>POST /auth/google"]
    end

    GOP --> LOGINPAGE
    GSB -->|"onSuccess"| THUNK
    THUNK --> AS
    AS --> BACKEND
    GSB -->|"onClick"| GOOGLE
    GOOGLE -->|"credential"| GSB
    THUNK --> SLICE
```

---

## Component Hierarchy

```mermaid
flowchart TB
    subgraph HIERARCHY["Component Hierarchy"]
        direction TB

        APP["App.tsx<br/>─────────────<br/>GoogleOAuthProvider"]

        ROUTER["AppRouter"]

        LOGINPAGE["LoginPage<br/>─────────────<br/>Container Component"]

        subgraph CHILDREN["Child Components"]
            LF["LoginForm"]
            DIVIDER["Divider (or)"]
            GSB["GoogleSignInButton"]
            LINK["Register Link"]
        end
    end

    APP --> ROUTER --> LOGINPAGE --> CHILDREN
```

---

## Data Flow Sequence

```mermaid
sequenceDiagram
    participant User
    participant GSB as GoogleSignInButton
    participant Google as Google Popup
    participant Thunk as googleLogin
    participant Service as authService
    participant API as Backend
    participant Slice as authSlice
    participant LS as localStorage

    User->>GSB: Click button
    GSB->>Google: Open popup

    Note over Google: User authenticates

    Google-->>GSB: credential (ID Token)

    GSB->>Thunk: dispatch(googleLogin(credential))

    Note over Slice: pending → loading=true

    Thunk->>Service: googleLogin(idToken)
    Service->>API: POST /auth/google

    API-->>Service: { token, user }
    Service-->>Thunk: response

    Thunk->>LS: setItem("token")
    Thunk-->>Slice: payload

    Note over Slice: fulfilled → isAuthenticated=true

    GSB->>GSB: navigate("/board")
```

---

## State Management Flow

```mermaid
flowchart TB
    subgraph ACTIONS["Actions"]
        direction LR
        A1["googleLogin.pending"]
        A2["googleLogin.fulfilled"]
        A3["googleLogin.rejected"]
    end

    subgraph STATE["Redux State Changes"]
        direction TB

        subgraph PENDING["After pending"]
            SP1["loading: true"]
            SP2["error: null"]
        end

        subgraph FULFILLED["After fulfilled"]
            SF1["loading: false"]
            SF2["user: { id, name, ... }"]
            SF3["token: 'eyJhbG...'"]
            SF4["isAuthenticated: true"]
        end

        subgraph REJECTED["After rejected"]
            SR1["loading: false"]
            SR2["error: 'message'"]
        end
    end

    A1 --> PENDING
    A2 --> FULFILLED
    A3 --> REJECTED
```

---

## Google OAuth Library Components

```mermaid
flowchart TB
    subgraph LIBRARY["@react-oauth/google"]
        direction TB

        subgraph PROVIDER_COMP["GoogleOAuthProvider"]
            P1["Props: clientId"]
            P2["역할: SDK 초기화"]
            P3["위치: App.tsx (root)"]
        end

        subgraph LOGIN_COMP["GoogleLogin"]
            L1["Props: onSuccess, onError"]
            L2["역할: 로그인 버튼 렌더링"]
            L3["자동: Google 브랜드 스타일"]
        end
    end

    PROVIDER_COMP -->|"Context 제공"| LOGIN_COMP
```

---

## File Dependencies

```mermaid
flowchart LR
    subgraph FILES["File Dependencies"]
        direction TB

        ENV[".env<br/>VITE_GOOGLE_CLIENT_ID"]
        APP["App.tsx"]
        GSB["GoogleSignInButton.tsx"]
        THUNKS["authThunks.ts"]
        SERVICE["authService.ts"]
        SLICE["authSlice.ts"]
        INDEX["index.ts"]
        LOGINPAGE["LoginPage.tsx"]
    end

    ENV -->|"env var"| APP
    APP -->|"Provider"| GSB
    GSB -->|"dispatch"| THUNKS
    THUNKS -->|"call"| SERVICE
    THUNKS -->|"extraReducers"| SLICE
    GSB -->|"import"| INDEX
    LOGINPAGE -->|"render"| GSB
```

---

## Comparison: Login Methods

```mermaid
flowchart TB
    subgraph METHODS["Login Methods in LoginPage"]
        direction LR

        subgraph PASSWORD["Password Login"]
            P1["LoginForm"]
            P2["login thunk"]
            P3["POST /auth/login"]
        end

        subgraph GOOGLE["Google Login"]
            G1["GoogleSignInButton"]
            G2["googleLogin thunk"]
            G3["POST /auth/google"]
        end
    end

    PASSWORD --> SAME
    GOOGLE --> SAME

    subgraph SAME["Same Result"]
        S1["authSlice updated"]
        S2["localStorage token"]
        S3["navigate to /board"]
    end
```

| 항목 | Password Login | Google Login |
|------|----------------|--------------|
| UI Component | LoginForm | GoogleSignInButton |
| Thunk | login | googleLogin |
| API Endpoint | POST /auth/login | POST /auth/google |
| 인증 주체 | 우리 서버 (BCrypt) | Google |
| 결과 | 동일 | 동일 |

---

## Related Documentation

- [00-development-plan.md](./00-development-plan.md) - 구현 계획
- [02-design-patterns-and-solid.md](./02-design-patterns-and-solid.md) - 디자인 패턴
- [03-programming-concepts.md](./03-programming-concepts.md) - 프로그래밍 개념
