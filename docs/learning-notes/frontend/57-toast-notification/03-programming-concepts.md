# Story #57: Toast Notification System - Programming Concepts

## 1. Redux Toolkit - createSlice

### 개념
Redux의 boilerplate를 줄여주는 함수. Action type, action creator, reducer를 한 번에 생성

### 코드 예시
```typescript
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const toastSlice = createSlice({
  name: "toast",  // action type prefix: "toast/addToast"
  initialState: { toasts: [] },
  reducers: {
    addToast: (state, action: PayloadAction<{ type: ToastType; message: string }>) => {
      // Immer 덕분에 직접 수정 가능 (내부적으로 불변성 유지)
      state.toasts.push({
        id: crypto.randomUUID(),
        ...action.payload,
        createdAt: Date.now(),
      });
    },
  },
});

// 자동 생성됨
export const { addToast } = toastSlice.actions;  // action creator
export default toastSlice.reducer;               // reducer
```

### 핵심 포인트
- `PayloadAction<T>`: action.payload의 타입 지정
- Immer 내장으로 `state.toasts.push()` 가능 (원래 Redux는 불변 업데이트 필요)

---

## 2. crypto.randomUUID()

### 개념
브라우저 내장 API로 고유한 UUID v4 생성

### 사용
```typescript
const id = crypto.randomUUID();
// "550e8400-e29b-41d4-a716-446655440000" 형태
```

### 왜 사용?
- Toast마다 고유 ID 필요 (삭제 시 식별)
- 외부 라이브러리 없이 네이티브로 지원
- UUID v4는 충돌 확률 극히 낮음

---

## 3. Record<K, V> TypeScript 유틸리티

### 개념
키 타입 K와 값 타입 V를 가진 객체 타입 생성

### 코드 예시
```typescript
type ToastType = "success" | "info" | "warning" | "error";

// 모든 ToastType을 키로 가지고, string을 값으로 가지는 객체
const typeColors: Record<ToastType, string> = {
  success: "#00875a",
  info: "#0052cc",
  warning: "#ff991f",
  error: "#de350b",
};

// 타입 안전하게 접근
const color = typeColors[toast.type];  // string 보장
```

### 장점
- 모든 키가 정의되었는지 컴파일 타임에 체크
- `toast.type`이 ToastType이면 반드시 color 존재 보장

---

## 4. useAppSelector / useAppDispatch (Typed Hooks)

### 개념
Redux의 `useSelector`와 `useDispatch`에 타입을 적용한 커스텀 훅

### 정의
```typescript
// app/hooks.ts
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

### 사용
```typescript
// ToastContainer.tsx
const { toasts } = useAppSelector((state) => state.toast);
//                                 ↑ state가 RootState로 타입됨

const dispatch = useAppDispatch();
dispatch(addToast({ type: "success", message: "Hello" }));
//       ↑ thunk 액션도 타입 안전하게 dispatch
```

---

## 5. CSS-in-JS (Inline Styles)

### 개념
React에서 style 객체로 CSS 적용

### 코드 예시
```typescript
const containerStyle: React.CSSProperties = {
  position: "fixed",
  top: "20px",
  right: "20px",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

return <div style={containerStyle}>...</div>;
```

### `React.CSSProperties` 타입
- CSS 속성 자동완성
- 잘못된 속성값 컴파일 에러
- camelCase로 작성 (backgroundColor, not background-color)

---

## 6. Array.filter()로 불변 삭제

### 개념
배열에서 특정 항목을 제거한 새 배열 반환 (불변성 유지)

### 코드 예시
```typescript
// toastSlice.ts
removeToast: (state, action: PayloadAction<string>) => {
  // filter는 새 배열 반환 → 불변 업데이트
  state.toasts = state.toasts.filter((t) => t.id !== action.payload);
};
```

### vs splice (변형)
```typescript
// splice는 원본 배열 변경 (Redux에서 직접 사용 불가)
// filter는 새 배열 반환 (Redux 친화적)
```

---

## 7. useEffect Cleanup Function

### 개념
컴포넌트 언마운트 또는 의존성 변경 시 실행되는 정리 함수

### 코드 예시
```typescript
// App.tsx
useEffect(() => {
  // Setup: SignalR 연결 및 이벤트 등록
  signalRService.start();
  signalRService.onTaskCreated(handler);

  // Cleanup: 컴포넌트 언마운트 또는 isAuthenticated 변경 시
  return () => {
    signalRService.offTaskCreated();
    signalRService.stop();
  };
}, [isAuthenticated]);
```

### 실행 순서
```
Mount     → Setup 실행
Re-render → Cleanup 실행 → Setup 실행 (의존성 변경 시)
Unmount   → Cleanup 실행
```

---

## 8. Barrel Export (index.ts)

### 개념
하나의 파일에서 모듈의 모든 public API를 re-export

### 코드 예시
```typescript
// features/toast/index.ts
export { default as toastReducer } from "./store/toastSlice";
export { addToast, removeToast, clearAllToasts } from "./store/toastSlice";
export type { Toast, ToastType, ToastState } from "./types/toast.types";
export { ToastContainer } from "./components/ToastContainer";
```

### 사용 전
```typescript
import { addToast } from "./features/toast/store/toastSlice";
import { ToastContainer } from "./features/toast/components/ToastContainer";
```

### 사용 후
```typescript
import { addToast, ToastContainer } from "./features/toast";
```

---

## 요약 테이블

| 개념 | 용도 | 파일 |
|------|------|------|
| createSlice | Redux 상태/액션 정의 | toastSlice.ts |
| PayloadAction | 액션 payload 타입 | toastSlice.ts |
| crypto.randomUUID() | 고유 ID 생성 | toastSlice.ts |
| Record<K,V> | 타입 안전한 객체 | ToastItem.tsx |
| useAppSelector | 타입된 상태 읽기 | ToastContainer.tsx |
| useAppDispatch | 타입된 액션 dispatch | ToastItem.tsx, App.tsx |
| React.CSSProperties | 인라인 스타일 타입 | ToastContainer.tsx, ToastItem.tsx |
| Array.filter() | 불변 배열 삭제 | toastSlice.ts |
| useEffect cleanup | 리소스 정리 | App.tsx |
| Barrel export | 모듈 re-export | index.ts |
