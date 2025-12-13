# Programming Concepts: Task CRUD

## Overview

Task CRUD 구현에서 배울 수 있는 TypeScript/React 프로그래밍 개념

---

## 1. Optimistic vs Pessimistic Update

### Pessimistic Update (현재 구현)

```typescript
// 서버 응답을 기다린 후 UI 업데이트
const handleSubmit = async (data: CreateTaskRequestDto) => {
  const result = await dispatch(createTask(data));  // 서버 응답 대기

  if (createTask.fulfilled.match(result)) {
    navigate("/board");  // 성공 확인 후 이동
  }
};
```

### Optimistic Update (대안)

```typescript
// UI 먼저 업데이트, 실패 시 롤백
dispatch({ type: "task/addOptimistic", payload: tempTask });  // 즉시 UI 업데이트

try {
  await taskService.createTask(data);
} catch {
  dispatch({ type: "task/removeOptimistic", payload: tempTask.id });  // 롤백
}
```

### 비교

| 방식 | 장점 | 단점 | 적합한 경우 |
|------|------|------|------------|
| Pessimistic | 데이터 무결성 보장 | 느린 UX | CRUD, 결제 |
| Optimistic | 빠른 UX | 롤백 로직 복잡 | 좋아요, 댓글 |

---

## 2. Action Type Matching

### `.match()` 방식

```typescript
const result = await dispatch(createTask(data));

// 타입 안전한 분기
if (createTask.fulfilled.match(result)) {
  // result.payload는 TaskResponseDto 타입
  console.log(result.payload.id);
  navigate("/board");
}

if (createTask.rejected.match(result)) {
  // result.payload는 에러 메시지
  console.error(result.payload);
}
```

### `.unwrap()` 방식

```typescript
try {
  const task = await dispatch(createTask(data)).unwrap();
  // 성공: task는 TaskResponseDto
  navigate("/board");
} catch (error) {
  // 실패: error는 rejectWithValue의 값
  console.error(error);
}
```

### 비교

| 방식 | 특징 | 사용 시기 |
|------|------|----------|
| `.match()` | 조건문 분기, 예외 없음 | 세밀한 제어 필요 시 |
| `.unwrap()` | try-catch 사용 | 간단한 성공/실패 처리 |

---

## 3. Controlled Form State

```typescript
// Controlled Component: React state가 진실의 원천
const [formData, setFormData] = useState({
  title: initialValues?.title ?? "",
  description: initialValues?.description ?? "",
  status: initialValues?.status ?? "ToDo",
});

// 모든 변경이 state를 통해
<input
  value={formData.title}
  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
/>
```

### Controlled vs Uncontrolled

```typescript
// Controlled: React state가 소스
const [value, setValue] = useState("");
<input value={value} onChange={e => setValue(e.target.value)} />

// Uncontrolled: DOM이 소스
const inputRef = useRef<HTMLInputElement>(null);
<input ref={inputRef} defaultValue="" />
// 값 접근: inputRef.current?.value
```

---

## 4. Guard Clause (Early Return)

```typescript
// EditTaskPage.tsx
const canModify = user?.id === selectedTask?.createdBy.id || user?.role === "Admin";

// Guard 1: 로딩 중
if (loading && !selectedTask) {
  return <div>Loading...</div>;
}

// Guard 2: 에러
if (error) {
  return <div>{error}</div>;
}

// Guard 3: 데이터 없음
if (!selectedTask) {
  return null;
}

// Guard 4: 권한 없음
if (!canModify) {
  return <Navigate to={`/tasks/${id}`} replace />;
}

// 정상 케이스
return <TaskForm ... />;
```

### 중첩 조건문 vs Guard Clause

```typescript
// ❌ 중첩 조건문 (가독성 낮음)
if (selectedTask) {
  if (canModify) {
    return <EditForm />;
  } else {
    return <Navigate />;
  }
} else {
  return <Loading />;
}

// ✅ Guard Clause (가독성 높음)
if (!selectedTask) return <Loading />;
if (!canModify) return <Navigate />;
return <EditForm />;
```

---

## 5. Immutable State Update

```typescript
// taskSlice.ts - extraReducers (Immer 사용)

// Create: 앞에 추가
builder.addCase(createTask.fulfilled, (state, action) => {
  state.tasks.unshift(action.payload);
});

// Update: 해당 항목 교체
builder.addCase(updateTask.fulfilled, (state, action) => {
  const index = state.tasks.findIndex(t => t.id === action.payload.id);
  if (index !== -1) {
    state.tasks[index] = action.payload;
  }
});

// Delete: 필터링
builder.addCase(deleteTask.fulfilled, (state, action) => {
  state.tasks = state.tasks.filter(t => t.id !== action.payload);
});
```

### Immer 동작 원리

```typescript
// 겉보기에는 mutation 같지만...
state.tasks.push(item);

// Immer가 내부적으로 새 객체 생성
// 불변성 자동 유지
```

---

## 6. Modal Accessibility Pattern

```typescript
// 모달 오버레이
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
    {/* 모달 내용 */}
  </div>
</div>
```

### CSS 클래스 설명

| 클래스 | 역할 |
|--------|------|
| `fixed inset-0` | 전체 화면 덮음 |
| `bg-black bg-opacity-50` | 반투명 배경 |
| `z-50` | 다른 요소 위에 표시 |
| `flex items-center justify-center` | 중앙 정렬 |

---

## 7. Async/Await Error Handling

```typescript
const handleDelete = async () => {
  if (!id) return;  // Guard

  setIsDeleting(true);  // 1. 로딩 시작

  const result = await dispatch(deleteTask(Number(id)));  // 2. 비동기 실행

  if (deleteTask.fulfilled.match(result)) {
    navigate("/board");  // 3a. 성공: 이동
  } else {
    setIsDeleting(false);       // 3b. 실패: 상태 복구
    setShowDeleteModal(false);
  }
};
```

### 패턴 순서

1. 로딩 상태 시작
2. 비동기 작업 실행
3. 성공/실패에 따른 분기
4. 상태 정리

---

## 8. Route Parameter vs Location State

### URL Parameter (사용 중)

```typescript
// 라우트 정의
<Route path="/tasks/:id/edit" element={<EditTaskPage />} />

// 파라미터 추출
const { id } = useParams<{ id: string }>();
// URL: /tasks/4/edit → id = "4"
```

### Location State (대안)

```typescript
// 전달
navigate("/tasks/edit", { state: { taskId: 4 } });

// 수신
const { state } = useLocation();
const taskId = state?.taskId;
```

### 비교

| 방식 | 장점 | 단점 |
|------|------|------|
| URL Parameter | 북마크 가능, 새로고침 유지 | URL에 노출 |
| Location State | URL 깔끔 | 새로고침 시 유실 |

---

## 9. Optional Chaining과 Nullish Coalescing

### Optional Chaining (`?.`)

```typescript
// 안전한 속성 접근
const creatorId = selectedTask?.createdBy?.id;
// selectedTask가 null이면 → undefined

// 안전한 메서드 호출
error?.response?.data?.message;
```

### Nullish Coalescing (`??`)

```typescript
// null/undefined일 때만 기본값
const title = initialValues?.title ?? "";
// title이 빈 문자열("")이면 → "" (유지)
// title이 undefined면 → "" (기본값)

// OR 연산자와 차이
const a = "" || "default";  // "default" (빈 문자열은 falsy)
const b = "" ?? "default";  // "" (빈 문자열은 nullish 아님)
```

---

## 10. Type Import

```typescript
// 일반 import: 값 + 타입
import { TaskResponseDto } from "./api.types";

// type import: 타입만 (런타임에 제거됨)
import type { TaskResponseDto } from "./api.types";

// 혼합 사용
import { taskService } from "./taskService";
import type { CreateTaskRequestDto, UpdateTaskRequestDto } from "./api.types";
```

### 장점

- 번들 크기 최적화 (타입은 컴파일 시 제거)
- 순환 참조 방지
- 의도 명확히 표현

---

## 11. React Router Navigate

### 프로그래매틱 네비게이션

```typescript
const navigate = useNavigate();

// 단순 이동
navigate("/board");

// replace: 뒤로가기 히스토리에서 제외
navigate("/board", { replace: true });

// 상대 경로
navigate(-1);  // 뒤로가기
```

### Navigate 컴포넌트

```typescript
// 조건부 리다이렉트
if (!canModify) {
  return <Navigate to={`/tasks/${id}`} replace />;
}
```

---

## 12. 핵심 개념 요약

| 개념 | 용도 | 예시 |
|------|------|------|
| Pessimistic Update | 데이터 무결성 | CRUD 작업 |
| `.match()` | Action 결과 분기 | `thunk.fulfilled.match(result)` |
| Guard Clause | 조기 반환으로 가독성 향상 | `if (!data) return null` |
| Immer | 불변성 자동 유지 | `state.tasks.push(item)` |
| `??` | null/undefined 기본값 | `value ?? "default"` |
| `?.` | 안전한 속성 접근 | `obj?.prop?.method` |
| `import type` | 타입만 import | `import type { T }` |
