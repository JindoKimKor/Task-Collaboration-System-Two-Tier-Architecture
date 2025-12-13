# Task #17: LoginPage Development Plan

## Overview
LoginPage 컴포넌트 생성 및 라우팅 설정.

## Task Requirements
- [x] Create LoginPage as a Container Component
- [x] Connect to Redux (dispatch login thunk)
- [x] Handle navigation on successful login
- [x] Add /login route to AppRouter
- [x] Export from auth/index.ts

## Architecture

```mermaid
flowchart TB
    subgraph Router["AppRouter.tsx"]
        R["/login Route"]
    end

    subgraph Container["LoginPage.tsx"]
        LP[LoginPage]
        D[dispatch]
        N[navigate]
    end

    subgraph UI["LoginForm.tsx"]
        LF[LoginForm]
    end

    subgraph State["Redux Store"]
        AT[authThunks]
        AS[authSlice]
    end

    R --> LP
    LP --> LF
    LP --> D
    D --> AT
    AT --> AS
    AS -->|"isAuthenticated"| N
    N -->|"/board"| Router
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| pages/LoginPage.tsx | CREATE | Container component |
| router/AppRouter.tsx | MODIFY | Add /login route |
| auth/index.ts | MODIFY | Export LoginPage |

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LP as LoginPage
    participant LF as LoginForm
    participant R as Redux
    participant API as Backend

    U->>LP: Navigate to /login
    LP->>LF: Render form
    U->>LF: Enter credentials
    U->>LF: Click Submit
    LF->>LP: onSubmit(data)
    LP->>R: dispatch(login(data))
    R->>API: POST /auth/login
    API-->>R: { token, user }
    R-->>LP: isAuthenticated = true
    LP->>LP: navigate("/board")
```

## E2E Test Results
- ✅ Invalid credentials → 401 error displayed
- ✅ Client validation → Required field errors
- ✅ Successful login → Token stored in localStorage
