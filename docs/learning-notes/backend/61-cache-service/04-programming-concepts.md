# Programming Concepts

## 1. IMemoryCache (.NET Built-in)

### 개념

.NET에서 제공하는 인메모리 캐싱 라이브러리

```mermaid
flowchart TB
    subgraph MEMORY["Application Memory"]
        Cache["IMemoryCache<br/>─────────────<br/>Dictionary 기반<br/>Thread-safe<br/>TTL 자동 관리"]
    end

    subgraph FEATURES["Features"]
        F1["키-값 저장"]
        F2["자동 만료 (TTL)"]
        F3["메모리 압력 시 자동 제거"]
        F4["Thread-safe"]
    end

    Cache --> FEATURES
```

### 등록

```csharp
// Program.cs
builder.Services.AddMemoryCache();  // IMemoryCache 등록
```

이 한 줄로:
- `IMemoryCache` 인터페이스를 DI 컨테이너에 등록
- Singleton lifetime으로 등록됨
- 내부적으로 `MemoryCache` 구현체 사용

### 주요 메서드

```csharp
// 값 조회 (out 파라미터 사용)
bool found = _cache.TryGetValue("key", out MyType value);

// 값 저장 (옵션과 함께)
_cache.Set("key", value, options);

// 값 삭제
_cache.Remove("key");

// 값 조회 또는 생성 (GetOrCreate)
var value = _cache.GetOrCreate("key", entry => {
    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
    return ComputeValue();
});
```

---

## 2. MemoryCacheEntryOptions (캐시 옵션)

### 개념

캐시 항목의 만료 정책을 설정하는 클래스

```mermaid
flowchart TB
    subgraph OPTIONS["MemoryCacheEntryOptions"]
        Absolute["AbsoluteExpirationRelativeToNow<br/>─────────────<br/>지정 시간 후 무조건 만료<br/>예: 5분 후"]

        Sliding["SlidingExpiration<br/>─────────────<br/>마지막 접근 후 시간 경과 시 만료<br/>예: 10분간 미사용 시"]

        Priority["Priority<br/>─────────────<br/>메모리 부족 시 제거 우선순위<br/>Low, Normal, High, NeverRemove"]
    end
```

### 만료 정책 비교

```mermaid
flowchart LR
    subgraph ABSOLUTE["AbsoluteExpiration"]
        A1["T+0: 캐시 저장"]
        A2["T+5분: 만료 ✗"]
        A3["(접근 여부 무관)"]
    end

    subgraph SLIDING["SlidingExpiration"]
        S1["T+0: 캐시 저장"]
        S2["T+3분: 접근 → 타이머 리셋"]
        S3["T+8분: 접근 → 타이머 리셋"]
        S4["T+18분: 10분 미사용 → 만료 ✗"]
    end
```

### 우리 코드

```csharp
public void Set<T>(string key, T value, TimeSpan? ttl = null)
{
    var options = new MemoryCacheEntryOptions
    {
        // 현재 시간 기준 TTL 후 만료
        AbsoluteExpirationRelativeToNow = ttl ?? _defaultTtl
    };
    _cache.Set(key, value, options);
}
```

**왜 Absolute?**
- 데이터 신선도 보장 (5분마다 DB에서 최신 데이터)
- Sliding은 계속 접근하면 영원히 만료 안 됨

---

## 3. Generic Method (제네릭 메서드)

### 개념

타입을 파라미터로 받는 메서드

```mermaid
flowchart TB
    subgraph GENERIC["Generic Method"]
        Def["T? Get‹T›(string key)"]
        Call1["Get‹TaskResponseDto›('task_5')"]
        Call2["Get‹UserDto›('user_3')"]
        Call3["Get‹string›('config_key')"]
    end

    Def --> Call1
    Def --> Call2
    Def --> Call3
```

### 코드 비교

```csharp
// ❌ 제네릭 없이 - 타입마다 메서드 필요
TaskResponseDto? GetTask(string key);
UserDto? GetUser(string key);
string? GetString(string key);

// ✓ 제네릭 사용 - 하나의 메서드로 모든 타입
T? Get<T>(string key);

// 호출
var task = _cache.Get<TaskResponseDto>("task_5");
var user = _cache.Get<UserDto>("user_3");
```

### 우리 코드

```csharp
public T? Get<T>(string key)
{
    _cache.TryGetValue(key, out T? value);
    return value;
}

public void Set<T>(string key, T value, TimeSpan? ttl = null)
{
    // ...
    _cache.Set(key, value, options);
}
```

**장점:**
- 타입 안전성 (컴파일 타임 체크)
- 코드 재사용
- 캐스팅 불필요

---

## 4. Tuple Return Type (튜플 반환)

### 개념

여러 값을 하나의 메서드에서 반환

```mermaid
flowchart LR
    subgraph METHOD["메서드"]
        Sig["Task‹(TaskResponseDto? task, bool cacheHit)›<br/>GetTaskByIdAsync(int id)"]
    end

    subgraph RETURN["반환"]
        Ret["return (dto, false);"]
    end

    subgraph USAGE["사용"]
        Dec["var (task, cacheHit) = await GetTaskByIdAsync(5);"]
    end

    METHOD --> RETURN --> USAGE
```

### 왜 Tuple?

```csharp
// ❌ 별도 클래스 생성 (과도한 보일러플레이트)
public class GetTaskResult
{
    public TaskResponseDto? Task { get; set; }
    public bool CacheHit { get; set; }
}

// ✓ Tuple 사용 (간결함)
public async Task<(TaskResponseDto? task, bool cacheHit)> GetTaskByIdAsync(int id)
{
    // Cache HIT
    return (cachedTask, true);

    // Cache MISS
    return (dto, false);
}
```

### Deconstruction (분해)

```csharp
// Controller에서 사용
var (task, cacheHit) = await _taskService.GetTaskByIdAsync(id);

// 개별 변수로 분해됨
// task: TaskResponseDto? → 응답 데이터
// cacheHit: bool → X-Cache 헤더 결정
```

---

## 5. Configuration Binding

### 개념

appsettings.json의 값을 코드에서 읽기

```mermaid
flowchart TB
    subgraph JSON["appsettings.json"]
        Config["CacheSettings:<br/>  TaskCacheTTLMinutes: 5<br/>  SimulatedDelaySeconds: 2"]
    end

    subgraph CODE["C# Code"]
        GetValue["configuration.GetValue‹int›(<br/>  'CacheSettings:TaskCacheTTLMinutes',<br/>  5  // default value<br/>)"]
    end

    subgraph RESULT["Result"]
        Value["int ttlMinutes = 5"]
    end

    JSON --> GetValue --> Value
```

### IConfiguration 주입

```csharp
public class CacheService : ICacheService
{
    public CacheService(IMemoryCache cache, IConfiguration configuration)
    {
        _cache = cache;

        // Configuration에서 값 읽기 (기본값 5)
        var ttlMinutes = configuration.GetValue<int>(
            "CacheSettings:TaskCacheTTLMinutes",
            5  // appsettings.json에 없으면 기본값
        );

        _defaultTtl = TimeSpan.FromMinutes(ttlMinutes);
    }
}
```

### 키 형식

```
"CacheSettings:TaskCacheTTLMinutes"
     ↑               ↑
  섹션 이름       속성 이름

// 중첩 가능
"Logging:LogLevel:Default"
```

---

## 6. Response Headers

### 개념

HTTP 응답에 메타데이터 추가

```mermaid
flowchart LR
    subgraph RESPONSE["HTTP Response"]
        Status["200 OK"]
        Headers["Headers:<br/>─────────────<br/>Content-Type: application/json<br/>X-Cache: HIT<br/>Date: ..."]
        Body["Body:<br/>{...}"]
    end
```

### 우리 코드

```csharp
public async Task<IActionResult> GetTask(int id)
{
    var (task, cacheHit) = await _taskService.GetTaskByIdAsync(id);

    // 커스텀 헤더 추가
    Response.Headers["X-Cache"] = cacheHit ? "HIT" : "MISS";

    return Ok(task);
}
```

### Response 객체

```mermaid
flowchart TB
    subgraph CONTROLLER["ControllerBase"]
        Response["Response (HttpResponse)<br/>─────────────<br/>.Headers<br/>.StatusCode<br/>.Body"]
    end

    subgraph HEADERS["Headers (IHeaderDictionary)"]
        Add["['X-Cache'] = 'HIT'"]
        ContentType["['Content-Type'] = '...'"]
    end

    CONTROLLER --> HEADERS
```

**X-Cache 헤더:**
- 표준 아님 (커스텀 헤더)
- `X-` 접두사: 비표준 헤더 관례
- CDN, 프록시 캐시에서도 널리 사용

---

## 7. Task.Delay (비동기 지연)

### 개념

비동기적으로 실행을 일시 중지

```mermaid
sequenceDiagram
    participant Thread as Thread Pool
    participant Delay as Task.Delay

    Note over Thread: 스레드 사용 중
    Thread->>Delay: await Task.Delay(2000ms)
    Note over Thread: 스레드 반환 (다른 작업 가능)
    Note over Delay: 2초 대기 (타이머)
    Delay-->>Thread: 완료
    Note over Thread: 스레드 재할당
```

### 우리 코드

```csharp
// Cache MISS 시 2초 지연 (데모용)
await Task.Delay(TimeSpan.FromSeconds(_simulatedDelaySeconds));
```

### vs Thread.Sleep

```csharp
// ❌ Thread.Sleep - 스레드 블로킹
Thread.Sleep(2000);  // 스레드가 2초간 아무것도 못 함

// ✓ Task.Delay - 비동기 대기
await Task.Delay(2000);  // 스레드 반환, 다른 요청 처리 가능
```

**왜 중요?**
- 웹 서버는 제한된 스레드 풀
- 블로킹 = 스레드 낭비 = 확장성 저하
- 비동기 = 스레드 효율적 사용

---

## Summary Table

| Concept | Purpose | 파일 |
|---------|---------|------|
| IMemoryCache | .NET 내장 캐시 | CacheService.cs |
| MemoryCacheEntryOptions | TTL 설정 | CacheService.cs |
| Generic Method `<T>` | 타입 재사용 | ICacheService.cs |
| Tuple Return | 다중 값 반환 | ITaskService.cs |
| IConfiguration | 설정 읽기 | CacheService.cs |
| Response.Headers | 커스텀 헤더 | TasksController.cs |
| Task.Delay | 비동기 지연 | TaskService.cs |
