# Redux Data Flow: Task Feature

## Overview

Redux Toolkit을 사용한 Task feature의 데이터 흐름을 상세히 설명

---

## 1. Redux Toolkit 핵심 개념

### 3가지 주요 구성요소

```mermaid
graph TB
    subgraph Redux["Redux Toolkit"]
        SL[Slice<br/>상태 + 리듀서 정의]
        TH[Thunk<br/>비동기 작업]
        SV[Service<br/>API 호출]
    end

    subgraph Flow["데이터 흐름"]
        C[Component] -->|dispatch| TH
        TH -->|call| SV
        SV -->|HTTP| API[Backend]
        API -->|response| SV
        SV -->|return| TH
        TH -->|action| SL
        SL -->|state| C
    end
```

---

## 2. Slice vs Thunk 역할 분리

### Slice (taskSlice.ts)

```mermaid
graph LR
    subgraph Slice["Slice 역할"]
        S1[상태 정의<br/>initialState]
        S2[동기 액션<br/>reducers]
        S3[비동기 액션 처리<br/>extraReducers]
    end
```

**코드 예시:**
```typescript
const taskSlice = createSlice({
  name: "task",
  initialState: {
    tasks: [],
    loading: false,
    error: null,
  },
  reducers: {
    // 동기 액션 (선택사항)
    clearTasks: (state) => {
      state.tasks = [];
    },
  },
  extraReducers: (builder) => {
    // 비동기 Thunk 결과 처리
    builder.addCase(fetchTasks.fulfilled, (state, action) => {
      state.tasks = action.payload.data;
    });
  },
});
```

### Thunk (taskThunks.ts)

```mermaid
graph LR
    subgraph Thunk["Thunk 역할"]
        T1[비동기 작업 실행]
        T2[API 호출]
        T3[에러 처리]
    end
```

**코드 예시:**
```typescript
export const fetchTasks = createAsyncThunk(
  "task/fetchTasks",
  async (params, { rejectWithValue }) => {
    try {
      return await taskService.getTasks(params);
    } catch (error) {
      return rejectWithValue(errorMessage);
    }
  }
);
```

---

## 3. createAsyncThunk 생명주기

### 3가지 자동 생성 액션

```mermaid
stateDiagram-v2
    [*] --> pending: dispatch(fetchTasks())
    pending --> fulfilled: API 성공
    pending --> rejected: API 실패
    fulfilled --> [*]
    rejected --> [*]
```

| 액션 | 시점 | 용도 |
|------|------|------|
| `pending` | 요청 시작 | loading = true |
| `fulfilled` | 요청 성공 | 데이터 저장 |
| `rejected` | 요청 실패 | 에러 메시지 저장 |

### extraReducers에서 처리

```typescript
extraReducers: (builder) => {
  builder
    // 1. 요청 시작
    .addCase(fetchTasks.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    // 2. 요청 성공
    .addCase(fetchTasks.fulfilled, (state, action) => {
      state.loading = false;
      state.tasks = action.payload.data;
      state.totalCount = action.payload.totalCount;
    })
    // 3. 요청 실패
    .addCase(fetchTasks.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
},
```

---

## 4. 전체 데이터 흐름

### Step-by-Step 흐름

```mermaid
sequenceDiagram
    participant BP as BoardPage
    participant D as dispatch
    participant TH as fetchTasks Thunk
    participant SV as taskService
    participant API as Backend
    participant SL as taskSlice
    participant ST as Redux Store

    Note over BP: 1. Component Mount

    BP->>D: dispatch(fetchTasks())

    Note over D: 2. Thunk 실행 시작

    D->>TH: Execute thunk
    TH->>SL: pending action
    SL->>ST: { loading: true }
    ST->>BP: Re-render (로딩 스피너)

    Note over TH: 3. API 호출

    TH->>SV: getTasks()
    SV->>API: GET /api/tasks
    API-->>SV: { data: [...], totalCount: 7 }
    SV-->>TH: TaskListResponseDto

    Note over TH: 4. 성공 처리

    TH->>SL: fulfilled action + payload
    SL->>ST: { loading: false, tasks: [...] }
    ST->>BP: Re-render (Task 목록 표시)
```

---

## 5. Service Layer의 역할

### API 호출 분리

```mermaid
graph TB
    subgraph Why["왜 Service를 분리하는가?"]
        W1[관심사 분리<br/>Thunk는 로직만]
        W2[재사용성<br/>여러 Thunk에서 사용]
        W3[테스트 용이<br/>Mock 가능]
    end
```

**taskService.ts:**
```typescript
export const taskService = {
  /**
   * Task 목록 조회
   * GET /api/tasks
   */
  getTasks: async (params?: TaskQueryParams): Promise<TaskListResponseDto> => {
    const response = await api.get<TaskListResponseDto>("/tasks", { params });
    return response.data;
  },

  /**
   * 단일 Task 조회
   * GET /api/tasks/:id
   */
  getTaskById: async (id: number): Promise<TaskResponseDto> => {
    const response = await api.get<TaskResponseDto>(`/tasks/${id}`);
    return response.data;
  },
};
```

---

## 6. Component에서 Redux 사용

### useSelector와 useDispatch

```mermaid
graph LR
    subgraph Hooks["Redux Hooks"]
        H1[useSelector<br/>상태 읽기]
        H2[useDispatch<br/>액션 발송]
    end

    subgraph Store["Redux Store"]
        S[task state]
    end

    H1 -->|읽기| S
    H2 -->|쓰기| S
```

**BoardPage.tsx:**
```typescript
const BoardPage = () => {
  const dispatch = useAppDispatch();

  // 상태 읽기
  const { tasks, loading, error } = useAppSelector((state) => state.task);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  return <KanbanBoard tasks={tasks} loading={loading} error={error} />;
};
```

---

## 7. useAppSelector vs useSelector

### 타입 안전한 커스텀 훅

```typescript
// app/hooks.ts
import { TypedUseSelectorHook, useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "./store";

// 타입이 적용된 커스텀 훅
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### 비교

| 훅 | 타입 | 사용 시 |
|----|------|---------|
| `useSelector` | 제네릭 필요 | `useSelector((state: RootState) => ...)` |
| `useAppSelector` | 자동 타입 추론 | `useAppSelector((state) => ...)` |

---

## 8. State 구조 설계

### TaskState 인터페이스

```typescript
export interface TaskState {
  tasks: TaskResponseDto[];      // Task 목록
  selectedTask: TaskResponseDto | null;  // 선택된 Task (상세보기용)
  totalCount: number;            // 전체 개수
  page: number;                  // 현재 페이지
  pageSize: number;              // 페이지 크기
  loading: boolean;              // 로딩 상태
  error: string | null;          // 에러 메시지
}
```

### 초기 상태

```typescript
const initialState: TaskState = {
  tasks: [],
  selectedTask: null,
  totalCount: 0,
  page: 1,
  pageSize: 100,  // Kanban은 전체 로드
  loading: false,
  error: null,
};
```

---

## 9. Error Handling 패턴

### rejectWithValue 사용

```mermaid
graph TB
    subgraph Error["에러 처리 흐름"]
        E1[API 호출]
        E2{에러 발생?}
        E3[rejectWithValue]
        E4[rejected action]
        E5[state.error 설정]

        E1 --> E2
        E2 -->|Yes| E3
        E3 --> E4
        E4 --> E5
    end
```

**Thunk에서:**
```typescript
export const fetchTasks = createAsyncThunk(
  "task/fetchTasks",
  async (params, { rejectWithValue }) => {
    try {
      return await taskService.getTasks(params);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch tasks"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);
```

**Slice에서:**
```typescript
.addCase(fetchTasks.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload as string;  // rejectWithValue의 값
});
```

---

## 10. Store 등록

### configureStore

```typescript
// app/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/store/authSlice";
import taskReducer from "../features/task/store/taskSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    task: taskReducer,  // Task feature 추가
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### RootState 타입

```mermaid
graph TB
    subgraph RootState["RootState 구조"]
        R[RootState]
        A[auth: AuthState]
        T[task: TaskState]

        R --> A
        R --> T
    end
```

---

## 11. Barrel Export (index.ts)

### 깔끔한 import를 위한 패턴

```typescript
// features/task/index.ts

// Store
export { default as taskReducer } from "./store/taskSlice";
export { fetchTasks, fetchTaskById } from "./store/taskThunks";

// Components
export { TaskCard } from "./components/TaskCard";
export { TaskColumn } from "./components/TaskColumn";
export { KanbanBoard } from "./components/KanbanBoard";

// Pages
export { BoardPage } from "./pages/BoardPage";

// Types
export type { TaskResponseDto, TaskStatus } from "./types/api.types";
export type { TaskState } from "./types/state.types";
```

### 사용 시

```typescript
// Before (개별 import)
import taskReducer from "../features/task/store/taskSlice";
import { fetchTasks } from "../features/task/store/taskThunks";

// After (barrel export)
import { taskReducer, fetchTasks } from "../features/task";
```

---

## 12. 핵심 포인트 요약

| 개념 | 설명 |
|------|------|
| **Slice** | 상태 정의 + 리듀서 (순수 함수) |
| **Thunk** | 비동기 작업 + API 호출 |
| **Service** | HTTP 요청 캡슐화 |
| **createAsyncThunk** | pending/fulfilled/rejected 자동 생성 |
| **extraReducers** | Thunk 결과를 상태에 반영 |
| **useAppSelector** | 타입 안전한 상태 읽기 |
| **rejectWithValue** | 에러 메시지 전달 |
