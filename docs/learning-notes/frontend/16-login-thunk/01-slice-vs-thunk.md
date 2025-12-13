# Slice vs Thunk: Core Redux Toolkit Concepts

## Overview

Redux Toolkit에서 가장 중요한 두 개념: **Slice**와 **Thunk**의 차이점을 이해합니다.

---

## 1. Slice (createSlice)

### 정의
Redux 상태의 한 "조각"을 관리하는 단위. 상태 + 상태를 변경하는 방법을 정의.

### 특징

| 항목 | 설명 |
|------|------|
| **순수성** | 순수 함수만 포함 (같은 입력 → 같은 출력) |
| **동기** | 모든 작업이 즉시 완료됨 |
| **Side Effect** | 없음 (API 호출, localStorage 접근 X) |
| **역할** | 상태 구조 정의, 상태 변경 로직 |

### 구성 요소

```typescript
const authSlice = createSlice({
  name: "auth",           // Slice 이름 (action type prefix)
  initialState,           // 초기 상태
  reducers: {             // 동기 액션들
    logout: (state) => {...},
    clearError: (state) => {...},
  },
  extraReducers: (builder) => {  // 외부 액션(Thunk) 처리
    builder.addCase(login.fulfilled, ...);
  },
});
```

### 비유
```
Slice = 창고 관리자
- 창고(state)가 어떻게 생겼는지 정의
- 물건을 어떻게 정리할지 규칙 정의
- 직접 밖에 나가서 물건을 가져오지 않음
```

---

## 2. Thunk (createAsyncThunk)

### 정의
비동기 작업을 처리하는 특별한 액션 생성자. 외부와 통신하고 결과를 Slice에 전달.

### 특징

| 항목 | 설명 |
|------|------|
| **순수성** | 비순수 함수 (외부 상태에 의존) |
| **비동기** | Promise 기반, 시간이 걸림 |
| **Side Effect** | 있음 (API 호출, localStorage 접근 O) |
| **역할** | 외부 통신, 부수 효과 처리 |

### 구성 요소

```typescript
export const login = createAsyncThunk(
  "auth/login",              // Action type
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.login(data);  // API 호출
      localStorage.setItem("token", response.token);   // Side effect
      return response;       // fulfilled payload
    } catch (error) {
      return rejectWithValue("Login failed");  // rejected payload
    }
  }
);
```

### 비유
```
Thunk = 배달원
- 밖에 나가서 물건(데이터)을 가져옴
- 창고 관리자(Slice)에게 물건 전달
- 배달 중, 배달 완료, 배달 실패 상태 보고
```

---

## 3. 비교 표

| 항목 | Slice | Thunk |
|------|-------|-------|
| **파일** | authSlice.ts | authThunks.ts |
| **생성** | createSlice | createAsyncThunk |
| **타입** | 동기 | 비동기 |
| **순수성** | 순수 함수 | 비순수 함수 |
| **API 호출** | ❌ | ✅ |
| **localStorage** | ❌ (보통) | ✅ |
| **상태 변경** | ✅ (직접) | ❌ (Slice 통해) |

---

## 4. 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                     Component (LoginPage)                        │
│                                                                  │
│   dispatch(login(formData))                                     │
│              │                                                   │
└──────────────┼───────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Thunk (authThunks.ts)                        │
│                                                                  │
│   1. authService.login(data) → API 호출                         │
│   2. localStorage.setItem() → 토큰 저장                          │
│   3. return response 또는 rejectWithValue(error)                │
│                                                                  │
│   자동 dispatch: login.pending → login.fulfilled/rejected       │
└─────────────────────────────────────────────────────────────────┘
               │
               │ (자동으로 action dispatch됨)
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Slice (authSlice.ts)                         │
│                                                                  │
│   extraReducers:                                                 │
│   - login.pending → loading = true                              │
│   - login.fulfilled → user, token, isAuthenticated 설정         │
│   - login.rejected → error 설정                                 │
│                                                                  │
│   상태 변경 → Redux Store 업데이트                               │
└─────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Component (LoginPage)                        │
│                                                                  │
│   useAppSelector로 상태 구독                                     │
│   → isAuthenticated 변경 감지 → navigate("/board")              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Thunk의 3가지 상태

createAsyncThunk는 자동으로 3가지 액션을 생성합니다:

### pending (진행 중)

```typescript
// Thunk 호출되면 자동 dispatch
{ type: "auth/login/pending" }

// Slice에서 처리
.addCase(login.pending, (state) => {
  state.loading = true;
  state.error = null;
})
```

**용도:** 로딩 스피너 표시, 버튼 비활성화

### fulfilled (성공)

```typescript
// Thunk에서 return하면 자동 dispatch
{ type: "auth/login/fulfilled", payload: response }

// Slice에서 처리
.addCase(login.fulfilled, (state, action) => {
  state.loading = false;
  state.user = action.payload.user;
  state.token = action.payload.token;
  state.isAuthenticated = true;
})
```

**용도:** 데이터 저장, 성공 UI 표시

### rejected (실패)

```typescript
// Thunk에서 rejectWithValue 또는 throw하면 자동 dispatch
{ type: "auth/login/rejected", payload: "Login failed" }

// Slice에서 처리
.addCase(login.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload as string;
})
```

**용도:** 에러 메시지 표시

---

## 6. 왜 분리했나?

### Before (한 파일)

```typescript
// authSlice.ts (133줄)
// - initialState
// - register thunk
// - login thunk
// - createSlice
// - reducers
// - extraReducers
```

**문제:**
- Slice와 Thunk 개념이 혼재
- 파일이 길어짐
- 어디가 순수 함수이고 어디가 비순수인지 불명확

### After (분리)

```
authSlice.ts (70줄)
- initialState
- createSlice
- reducers (logout, clearError)
- extraReducers (pending/fulfilled/rejected 처리)

authThunks.ts (72줄)
- register thunk
- login thunk
```

**장점:**
- 각 파일이 하나의 개념만 담당
- Slice = 순수, Thunk = 비순수 명확히 구분
- 새 thunk 추가 시 authThunks.ts만 수정

---

## 7. 요약

```
┌─────────────────────────────────────────────────────────────────┐
│                         Redux Toolkit                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐        ┌─────────────────┐                │
│  │     Thunk       │        │     Slice       │                │
│  │  (authThunks)   │   →    │  (authSlice)    │                │
│  ├─────────────────┤        ├─────────────────┤                │
│  │ • API 호출      │        │ • 상태 정의     │                │
│  │ • localStorage  │        │ • reducers      │                │
│  │ • 비동기 처리   │        │ • extraReducers │                │
│  │ • Side Effects  │        │ • 순수 함수     │                │
│  └─────────────────┘        └─────────────────┘                │
│                                                                  │
│  "밖에서 데이터 가져오기"     "가져온 데이터로 상태 업데이트"   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
