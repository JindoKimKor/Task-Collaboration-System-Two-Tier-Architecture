# Task #64: Frontend Cache Status UI Display - Development Plan

## 개요
Backend에서 보내는 X-Cache 헤더를 Frontend에서 읽어 TaskDetailsPage에 캐시 상태 배지 표시

---

## Task 목록

| Task | 설명 | 상태 |
|------|------|------|
| #64 | TaskDetailsPage에 Cache HIT/MISS 배지 표시 | ✅ 완료 |

---

## 구현 순서

### Step 1: taskService 수정
**파일:** `src/features/task/services/taskService.ts`
- `getTaskById` 반환 타입을 `{ data, cacheStatus }` 객체로 변경
- `response.headers["x-cache"]`에서 캐시 상태 추출
- Axios response headers는 소문자로 접근해야 함

### Step 2: state.types 수정
**파일:** `src/features/task/types/state.types.ts`
- TaskState에 `cacheStatus: "HIT" | "MISS" | null` 필드 추가
- Union Type으로 타입 안전성 보장

### Step 3: taskSlice 수정
**파일:** `src/features/task/store/taskSlice.ts`
- initialState에 cacheStatus: null 추가
- clearSelectedTask reducer에서 cacheStatus도 함께 초기화
- fetchTaskById.fulfilled에서 action.payload.data와 action.payload.cacheStatus 분리 저장

### Step 4: taskThunks 수정
**파일:** `src/features/task/store/taskThunks.ts`
- fetchTaskById 주석 업데이트 (반환값 문서화)

### Step 5: TaskDetailsPage 수정
**파일:** `src/features/task/pages/TaskDetailsPage.tsx`
- useAppSelector에서 cacheStatus 추출
- Header nav에 Cache 배지 UI 추가
- 조건부 렌더링으로 null일 때 배지 숨김

---

## 파일 구조

```
src/features/task/
├── services/
│   └── taskService.ts       # getTaskById 반환 타입 변경
├── types/
│   └── state.types.ts       # cacheStatus 필드 추가
├── store/
│   ├── taskSlice.ts         # cacheStatus 상태 관리
│   └── taskThunks.ts        # 주석 업데이트
└── pages/
    └── TaskDetailsPage.tsx  # Cache 배지 UI
```

---

## 데이터 흐름

```
API Response (X-Cache Header) → taskService → { data, cacheStatus }
                                                    ↓
                              Redux Store (taskSlice) → cacheStatus state
                                                    ↓
                              TaskDetailsPage → Cache: HIT/MISS 배지
```

---

## 트러블슈팅: React StrictMode 이슈

### 현상
- 개발 환경에서 Backend 재시작 후에도 항상 "Cache: HIT" 배지가 표시됨
- 첫 요청인데도 MISS가 아닌 HIT으로 보임

### 원인
React StrictMode가 개발 환경에서 useEffect를 **2번 실행**함:
```
1차 마운트 → useEffect 실행 (MISS, 2초 딜레이) → 캐시에 저장
언마운트 → cleanup 실행
2차 마운트 → useEffect 실행 (HIT, 즉시) → 이게 최종 state에 저장됨
```

### StrictMode 동작 원리
```tsx
// main.tsx
<React.StrictMode>
  <App />
</React.StrictMode>
```
- 개발 환경에서만 활성화
- 컴포넌트를 mount → unmount → mount 순서로 실행
- Side effect 관련 버그 조기 발견 목적

### 해결
- **버그가 아님** - 개발 환경에서만 발생하는 예상된 동작
- Production 빌드에서는 정상적으로 MISS가 먼저 표시됨
- 실제 캐시 동작은 정상 (첫 요청 2초 딜레이, 두 번째 요청 즉시)

---

## 테스트 시나리오

### 정상 동작 확인
1. Backend 재시작
2. Task 상세 페이지 접속
3. **2초 딜레이 발생** → 실제 MISS 동작
4. 새로고침
5. **즉시 로드** → HIT 동작

### StrictMode 영향
- UI 배지는 HIT으로 표시될 수 있음 (개발 환경)
- Network 탭에서 실제 X-Cache 헤더 값 확인 가능
- Production에서는 정상 표시
