# Story #57: Toast Notification System - Development Plan

## 개요
SignalR 실시간 이벤트를 사용자에게 시각적으로 알려주는 Toast Notification 시스템 구현

---

## Task 목록

| Task | 설명 | 상태 |
|------|------|------|
| #58 | toastSlice 생성 (Redux 상태 관리) | ✅ 완료 |
| #59 | ToastContainer, ToastItem 컴포넌트 | ✅ 완료 |
| #60 | SignalR → Toast 연동 | ✅ 완료 |

---

## 구현 순서

### Task #58: toastSlice 생성
1. `types/toast.types.ts` - Toast, ToastType, ToastState 타입 정의
2. `store/toastSlice.ts` - addToast, removeToast, clearAllToasts 액션
3. `app/store.ts` - toastReducer 등록
4. `index.ts` - Barrel exports

### Task #59: Toast UI 컴포넌트
1. `components/ToastItem.tsx` - 개별 Toast 렌더링 (색상, X 버튼)
2. `components/ToastContainer.tsx` - 화면 우상단 고정 컨테이너
3. `App.tsx` - ToastContainer 렌더링 추가
4. `index.ts` - 컴포넌트 exports 추가

### Task #60: SignalR 연동
1. `App.tsx` - addToast import 추가
2. SignalR 이벤트 핸들러에 Toast dispatch 추가
   - onTaskCreated → success Toast
   - onTaskUpdated → info Toast
   - onTaskDeleted → warning Toast

---

## 파일 구조

```
src/features/toast/
├── components/
│   ├── ToastContainer.tsx    # Task #59
│   └── ToastItem.tsx         # Task #59
├── store/
│   └── toastSlice.ts         # Task #58
├── types/
│   └── toast.types.ts        # Task #58
└── index.ts                  # Task #58, #59
```

---

## 데이터 흐름

```
SignalR Event → App.tsx Handler → dispatch(addToast) → Redux Store → ToastContainer → ToastItem
                                                                                         ↓
User clicks X → dispatch(removeToast) → Redux Store → ToastContainer (re-render)
```
