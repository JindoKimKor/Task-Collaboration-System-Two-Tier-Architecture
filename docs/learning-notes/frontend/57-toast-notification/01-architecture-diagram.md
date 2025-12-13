# Story #57: Toast Notification System - Architecture

## 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (React)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                           App.tsx                                     │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │  SignalR Event Handlers                                         │ │  │
│  │  │                                                                 │ │  │
│  │  │  onTaskCreated → dispatch(taskCreatedFromSignalR)              │ │  │
│  │  │                → dispatch(addToast({ type: "success" }))       │ │  │
│  │  │                                                                 │ │  │
│  │  │  onTaskUpdated → dispatch(taskUpdatedFromSignalR)              │ │  │
│  │  │                → dispatch(addToast({ type: "info" }))          │ │  │
│  │  │                                                                 │ │  │
│  │  │  onTaskDeleted → dispatch(taskDeletedFromSignalR)              │ │  │
│  │  │                → dispatch(addToast({ type: "warning" }))       │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  <ToastContainer />  ←── 화면 우상단 고정                            │  │
│  │  <AppRouter />                                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           Redux Store                                        │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│  │  auth slice    │  │  task slice    │  │  toast slice   │                │
│  │                │  │                │  │                │                │
│  │  user          │  │  tasks[]       │  │  toasts[]      │                │
│  │  token         │  │  loading       │  │    - id        │                │
│  │  isAuth        │  │  error         │  │    - type      │                │
│  └────────────────┘  └────────────────┘  │    - message   │                │
│                                          │    - createdAt │                │
│                                          └────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Toast Feature 구조

```
src/features/toast/
│
├── components/
│   ├── ToastContainer.tsx
│   │   └── 화면 우상단 고정 (position: fixed)
│   │   └── toasts 배열 순회하여 ToastItem 렌더링
│   │
│   └── ToastItem.tsx
│       └── 개별 Toast 표시
│       └── type별 배경색 (success/info/warning/error)
│       └── X 버튼 → dispatch(removeToast)
│
├── store/
│   └── toastSlice.ts
│       ├── addToast      → toasts 배열에 추가
│       ├── removeToast   → id로 찾아서 삭제
│       └── clearAllToasts → 모든 Toast 삭제
│
├── types/
│   └── toast.types.ts
│       ├── ToastType = "success" | "info" | "warning" | "error"
│       ├── Toast { id, type, message, createdAt }
│       └── ToastState { toasts: Toast[] }
│
└── index.ts (Barrel exports)
```

---

## 컴포넌트 계층

```
<App>
  └── <GoogleOAuthProvider>
        ├── <ToastContainer>              ←── position: fixed, top-right
        │     └── {toasts.map()}
        │           └── <ToastItem>       ←── 개별 Toast
        │                 ├── message
        │                 └── X button
        │
        └── <AppRouter>
              └── Pages...
```

---

## Toast 색상 매핑

```
┌─────────────┬─────────────┬──────────────────────────────┐
│ ToastType   │ 배경색      │ 사용 시점                    │
├─────────────┼─────────────┼──────────────────────────────┤
│ success     │ #00875a     │ Task 생성 성공               │
│ info        │ #0052cc     │ Task 업데이트, 할당          │
│ warning     │ #ff991f     │ Task 삭제                    │
│ error       │ #de350b     │ 오류 발생                    │
└─────────────┴─────────────┴──────────────────────────────┘
```

---

## SignalR → Toast 흐름

```
Backend                    Frontend
   │                          │
   │  ReceiveTaskCreated      │
   ├─────────────────────────►│
   │                          │  1. dispatch(taskCreatedFromSignalR)
   │                          │  2. dispatch(addToast({
   │                          │       type: "success",
   │                          │       message: "New task created: ${title}"
   │                          │     }))
   │                          │
   │                          │  Redux Store 업데이트
   │                          │     ↓
   │                          │  ToastContainer re-render
   │                          │     ↓
   │                          │  새 ToastItem 표시
   │                          │
   │                          │  [User clicks X]
   │                          │     ↓
   │                          │  dispatch(removeToast(id))
   │                          │     ↓
   │                          │  ToastItem 제거
```
