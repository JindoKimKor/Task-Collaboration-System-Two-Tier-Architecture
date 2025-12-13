# Programming Concepts

## HTTP Response Header Concepts

### 1. X-Cache Custom Header

```mermaid
flowchart LR
    subgraph BACKEND["Backend"]
        Response["HTTP Response<br/>───────────<br/>Headers:<br/>  X-Cache: HIT/MISS<br/>Body:<br/>  { task data }"]
    end

    subgraph FRONTEND["Frontend"]
        Access["response.headers['x-cache']<br/>───────────<br/>소문자로 접근!"]
    end

    BACKEND -->|"HTTP"| FRONTEND
```

**Implementation:**
```typescript
// Backend (C#) - 대소문자 상관없이 설정
Response.Headers["X-Cache"] = cacheHit ? "HIT" : "MISS";

// Frontend (TypeScript) - 반드시 소문자로 접근
const cacheStatus = response.headers["x-cache"];
```

**Why lowercase?**
- HTTP 헤더 이름은 case-insensitive
- Axios가 모든 헤더 이름을 소문자로 정규화
- `response.headers["X-Cache"]` → undefined
- `response.headers["x-cache"]` → "HIT"

---

### 2. CORS Header Exposure

```mermaid
flowchart TB
    subgraph CORS["CORS Policy"]
        Standard["Standard Headers<br/>───────────<br/>Content-Type<br/>Content-Length<br/>Cache-Control<br/>등"]
        Custom["Custom Headers<br/>───────────<br/>X-Cache<br/>X-Request-Id<br/>등"]
        Exposed["WithExposedHeaders()<br/>───────────<br/>Custom Header 노출 허용"]
    end

    Standard -->|"기본 허용"| Browser
    Custom -->|"기본 차단"| Blocked
    Custom -->|"WithExposedHeaders"| Exposed
    Exposed --> Browser
```

**Implementation:**
```csharp
// Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders("X-Cache");  // 핵심!
    });
});
```

**Why needed?**
- 브라우저 보안 정책으로 커스텀 헤더 기본 차단
- WithExposedHeaders로 명시적 허용 필요
- 없으면 `response.headers["x-cache"]` = undefined

---

## TypeScript Concepts

### 1. Union Type with Literal Types

```mermaid
flowchart TB
    subgraph UNION["Union Type"]
        direction TB
        Type["'HIT' | 'MISS' | null"]
        Valid["유효한 값<br/>───────────<br/>'HIT' ✅<br/>'MISS' ✅<br/>null ✅"]
        Invalid["무효한 값<br/>───────────<br/>'hit' ❌<br/>'UNKNOWN' ❌<br/>'miss' ❌"]
    end

    Type --> Valid
    Type --> Invalid
```

**Implementation:**
```typescript
// Type definition
cacheStatus: "HIT" | "MISS" | null;

// 컴파일 에러 예시
state.cacheStatus = "hit";      // ❌ Error: Type '"hit"' is not assignable
state.cacheStatus = "UNKNOWN";  // ❌ Error
state.cacheStatus = "HIT";      // ✅ OK
state.cacheStatus = null;       // ✅ OK
```

---

### 2. Type Assertion (as keyword)

```mermaid
flowchart LR
    subgraph ASSERTION["Type Assertion"]
        Unknown["response.headers['x-cache']<br/>───────────<br/>Type: string | undefined"]
        Asserted["as 'HIT' | 'MISS'<br/>───────────<br/>Type: 'HIT' | 'MISS'"]
    end

    Unknown -->|"as"| Asserted
```

**Implementation:**
```typescript
const cacheStatus = response.headers["x-cache"] as "HIT" | "MISS" || "MISS";
```

**Why assertion?**
- `response.headers[key]`는 기본적으로 `string | undefined`
- 백엔드에서 보내는 값이 "HIT" 또는 "MISS"임을 우리가 알고 있음
- Type assertion으로 정확한 타입 지정
- `|| "MISS"`로 undefined 처리

---

### 3. Object Return Type

```mermaid
flowchart TB
    subgraph RETURN["Return Type"]
        Simple["Promise<TaskResponseDto><br/>───────────<br/>단일 값 반환"]
        Complex["Promise<{ data, cacheStatus }><br/>───────────<br/>복합 객체 반환"]
    end

    Simple -->|"확장"| Complex
```

**Implementation:**
```typescript
getTaskById: async (id: number): Promise<{
  data: TaskResponseDto;
  cacheStatus: "HIT" | "MISS"
}> => {
  const response = await api.get<TaskResponseDto>(`/tasks/${id}`);
  const cacheStatus = response.headers["x-cache"] as "HIT" | "MISS" || "MISS";
  return { data: response.data, cacheStatus };
};
```

---

## Redux Toolkit Concepts

### 1. PayloadAction with Complex Type

```mermaid
flowchart TB
    subgraph PAYLOAD["PayloadAction"]
        Simple["PayloadAction<TaskResponseDto><br/>───────────<br/>action.payload = Task"]
        Complex["PayloadAction<{ data, cacheStatus }><br/>───────────<br/>action.payload.data = Task<br/>action.payload.cacheStatus = string"]
    end

    Simple -->|"변경"| Complex
```

**Implementation:**
```typescript
// Before
.addCase(fetchTaskById.fulfilled, (state, action) => {
  state.selectedTask = action.payload;  // TaskResponseDto
})

// After - payload 구조 변경
.addCase(fetchTaskById.fulfilled, (state, action) => {
  state.selectedTask = action.payload.data;        // TaskResponseDto
  state.cacheStatus = action.payload.cacheStatus;  // "HIT" | "MISS"
})
```

---

### 2. Immer와 State 변경

```mermaid
flowchart TB
    subgraph IMMER["Immer (Redux Toolkit 내장)"]
        Mutable["직접 수정 가능<br/>───────────<br/>state.cacheStatus = 'HIT'"]
        Immutable["내부적으로 불변성 유지<br/>───────────<br/>새 state 객체 생성"]
    end

    Mutable -->|"자동 변환"| Immutable
```

**Implementation:**
```typescript
// 이렇게 작성해도 됨 (Immer 덕분)
clearSelectedTask: (state) => {
  state.selectedTask = null;
  state.cacheStatus = null;  // 직접 수정
},
```

---

## React Concepts

### 1. React StrictMode

```mermaid
flowchart TB
    subgraph STRICT["StrictMode 동작"]
        direction TB
        Purpose["목적<br/>───────────<br/>Side effect 버그 조기 발견"]
        Behavior["동작<br/>───────────<br/>mount → unmount → mount<br/>useEffect 2번 실행"]
        When["언제<br/>───────────<br/>개발 환경에서만"]
    end

    subgraph IMPACT["영향"]
        direction TB
        API["API 2번 호출"]
        State["두 번째 결과가 최종 state"]
    end

    STRICT --> IMPACT
```

**Implementation:**
```tsx
// main.tsx
<React.StrictMode>
  <App />
</React.StrictMode>
```

**StrictMode 영향:**
- useEffect가 2번 실행됨
- 첫 번째 API 호출: MISS (캐시에 저장)
- 두 번째 API 호출: HIT (캐시에서 반환)
- UI에는 마지막 값인 HIT 표시

---

### 2. 조건부 렌더링 (Short-circuit Evaluation)

```mermaid
flowchart TB
    subgraph SHORTCIRCUIT["Short-circuit Evaluation"]
        Expr["cacheStatus && <Component />"]
        Truthy["cacheStatus = 'HIT'<br/>───────────<br/><Component /> 렌더링"]
        Falsy["cacheStatus = null<br/>───────────<br/>null 반환 (렌더링 안함)"]
    end

    Expr -->|"truthy"| Truthy
    Expr -->|"falsy"| Falsy
```

**Implementation:**
```tsx
{cacheStatus && (
  <span className="...">
    Cache: {cacheStatus}
  </span>
)}
```

**Why this pattern?**
- `null && <Component />` → null (아무것도 렌더링 안함)
- `"HIT" && <Component />` → `<Component />` 렌더링
- if문 없이 간결한 조건부 렌더링

---

### 3. Template Literal in className

```mermaid
flowchart LR
    subgraph TEMPLATE["Template Literal"]
        Static["정적 클래스<br/>───────────<br/>'ml-2 px-2 py-0.5'"]
        Dynamic["동적 클래스<br/>───────────<br/>${condition ? A : B}"]
        Result["결합된 className"]
    end

    Static --> Result
    Dynamic --> Result
```

**Implementation:**
```tsx
<span
  className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
    cacheStatus === "HIT"
      ? "bg-green-100 text-green-800"   // HIT: 초록색
      : "bg-yellow-100 text-yellow-800" // MISS: 노란색
  }`}
>
```

---

## Axios Response Concepts

### 1. Axios Response Structure

```mermaid
flowchart TB
    subgraph RESPONSE["AxiosResponse<T>"]
        Data["response.data<br/>───────────<br/>Type: T (Body)"]
        Headers["response.headers<br/>───────────<br/>Type: AxiosResponseHeaders"]
        Status["response.status<br/>───────────<br/>Type: number"]
    end
```

**Implementation:**
```typescript
const response = await api.get<TaskResponseDto>(`/tasks/${id}`);

// Body 접근
const task = response.data;  // TaskResponseDto

// Header 접근 (소문자!)
const cacheStatus = response.headers["x-cache"];  // string | undefined

// Status 접근
const statusCode = response.status;  // 200
```

---

## Summary Table

| 개념 | 설명 | 파일 |
|------|------|------|
| X-Cache Header | 캐시 상태 전달용 커스텀 헤더 | taskService.ts |
| WithExposedHeaders | CORS에서 커스텀 헤더 노출 허용 | Program.cs |
| Literal Union Type | "HIT" \| "MISS" \| null 타입 | state.types.ts |
| Type Assertion (as) | 타입 강제 지정 | taskService.ts |
| PayloadAction | Redux 액션 페이로드 타입 | taskSlice.ts |
| StrictMode | 개발 환경 디버깅 모드 | main.tsx |
| Short-circuit | cacheStatus && jsx 패턴 | TaskDetailsPage.tsx |
| Template Literal | 동적 className 생성 | TaskDetailsPage.tsx |
| Axios headers | 소문자로 접근 | taskService.ts |
