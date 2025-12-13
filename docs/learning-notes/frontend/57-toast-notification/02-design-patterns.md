# Story #57: Toast Notification System - Design Patterns

## 1. Redux Slice Pattern

### 개념
Redux Toolkit의 `createSlice`를 사용하여 관련 상태와 액션을 하나의 "slice"로 묶는 패턴

### 적용
```typescript
// toastSlice.ts
const toastSlice = createSlice({
  name: "toast",           // 액션 타입의 prefix
  initialState,            // 초기 상태
  reducers: {              // 액션 + 리듀서 정의
    addToast: (state, action) => { ... },
    removeToast: (state, action) => { ... },
    clearAllToasts: (state) => { ... },
  },
});
```

### 장점
- **Boilerplate 감소**: Action type, action creator, reducer를 한 번에 정의
- **Immer 내장**: 불변성 유지 없이 직접 state 수정 가능 (`state.toasts.push()`)
- **Type Safety**: TypeScript와 자연스럽게 통합

---

## 2. Barrel Export Pattern

### 개념
`index.ts`에서 feature의 모든 public API를 re-export하는 패턴

### 적용
```typescript
// features/toast/index.ts

// Store
export { default as toastReducer } from "./store/toastSlice";
export { addToast, removeToast, clearAllToasts } from "./store/toastSlice";

// Types
export type { Toast, ToastType, ToastState } from "./types/toast.types";

// Components
export { ToastContainer } from "./components/ToastContainer";
export { ToastItem } from "./components/ToastItem";
```

### 사용
```typescript
// 간결한 import
import { ToastContainer, addToast } from "./features/toast";

// vs 복잡한 import (Barrel 없이)
import { ToastContainer } from "./features/toast/components/ToastContainer";
import { addToast } from "./features/toast/store/toastSlice";
```

### 장점
- **캡슐화**: 내부 구조 변경 시 외부 import 영향 최소화
- **가독성**: import 문이 간결해짐
- **일관성**: feature별로 동일한 패턴 적용

---

## 3. Container/Presentational Pattern

### 개념
- **Container**: 상태 관리, Redux 연결 담당
- **Presentational**: UI 렌더링만 담당

### 적용
```typescript
// ToastContainer.tsx (Container)
export const ToastContainer = () => {
  const { toasts } = useAppSelector((state) => state.toast);  // 상태 읽기

  return (
    <div style={containerStyle}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />  // 데이터 전달
      ))}
    </div>
  );
};

// ToastItem.tsx (Presentational)
export const ToastItem = ({ toast }: ToastItemProps) => {
  const dispatch = useAppDispatch();

  return (
    <div style={...}>
      {toast.message}
      <button onClick={() => dispatch(removeToast(toast.id))}>×</button>
    </div>
  );
};
```

### 장점
- **재사용성**: Presentational 컴포넌트는 다른 곳에서 재사용 가능
- **테스트 용이**: UI 로직과 비즈니스 로직 분리

---

## 4. Event-Driven Pattern (SignalR → Redux)

### 개념
외부 이벤트(SignalR)를 Redux 액션으로 변환하는 패턴

### 적용
```typescript
// App.tsx
signalRService.onTaskCreated((data) => {
  // 1. 도메인 상태 업데이트
  dispatch(taskCreatedFromSignalR(data.task));

  // 2. UI 피드백 (Toast)
  dispatch(addToast({
    type: "success",
    message: `New task created: ${data.task.title}`,
  }));
});
```

### 흐름
```
External Event → Event Handler → Multiple Redux Actions → UI Updates
```

### 장점
- **관심사 분리**: 이벤트 소스(SignalR)와 상태 관리(Redux) 분리
- **확장성**: 하나의 이벤트에 여러 액션 연결 가능
- **추적 가능**: Redux DevTools로 모든 상태 변화 추적

---

## 5. Discriminated Union Pattern (ToastType)

### 개념
TypeScript의 union type으로 제한된 값 집합을 정의

### 적용
```typescript
// toast.types.ts
export type ToastType = "success" | "info" | "warning" | "error";

// ToastItem.tsx
const typeColors: Record<ToastType, string> = {
  success: "#00875a",
  info: "#0052cc",
  warning: "#ff991f",
  error: "#de350b",
};

const bgColor = typeColors[toast.type];  // 타입 안전
```

### 장점
- **타입 안전성**: 허용되지 않은 값 컴파일 타임에 에러
- **자동완성**: IDE에서 가능한 값 제안
- **Exhaustive Check**: switch문에서 모든 케이스 처리 강제
