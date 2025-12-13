# App-Level vs Page-Level SignalR Connection

## 문제 상황

### 증상
- BoardPage에서 SignalR 연결됨
- Create Task 페이지로 이동
- 다른 사용자가 Task 생성
- BoardPage로 돌아와도 새 Task가 안 보임

### Console 로그
```
SignalR connected
Joined TaskBoard group
// Navigate to /tasks/new
SignalR disconnected      // ← 문제!
Left TaskBoard group
// Navigate back to /board
SignalR connected         // 다시 연결되지만 이미 놓친 이벤트
Joined TaskBoard group
```

---

## 아키텍처 비교

### Page-Level Connection (이전 방식)

```mermaid
sequenceDiagram
    participant User
    participant BoardPage
    participant CreatePage
    participant SignalR
    participant Backend

    User->>BoardPage: Navigate to /board
    BoardPage->>SignalR: connect()
    SignalR->>Backend: WebSocket Open
    Note over SignalR,Backend: Connected

    User->>CreatePage: Navigate to /tasks/new
    BoardPage->>SignalR: disconnect()
    SignalR->>Backend: WebSocket Close
    Note over SignalR,Backend: Disconnected!

    Backend->>Backend: Other user creates task
    Note over Backend: SignalR event sent
    Note over SignalR: No connection to receive!

    User->>BoardPage: Navigate back to /board
    BoardPage->>SignalR: connect()
    Note over User: Missed the new task!
```

### App-Level Connection (현재 방식)

```mermaid
sequenceDiagram
    participant User
    participant App
    participant BoardPage
    participant CreatePage
    participant SignalR
    participant Backend

    User->>App: Login (isAuthenticated = true)
    App->>SignalR: connect()
    SignalR->>Backend: WebSocket Open
    Note over SignalR,Backend: Connected (유지됨)

    User->>BoardPage: Navigate to /board
    Note over SignalR,Backend: Still connected

    User->>CreatePage: Navigate to /tasks/new
    Note over SignalR,Backend: Still connected

    Backend->>SignalR: TaskCreated event
    SignalR->>App: Event received
    App->>App: dispatch(taskCreatedFromSignalR)
    Note over App: Redux store updated

    User->>BoardPage: Navigate back to /board
    Note over User: New task is visible!

    User->>App: Logout (isAuthenticated = false)
    App->>SignalR: disconnect()
```

---

## 코드 비교

### Page-Level (BoardPage.tsx) - 이전 방식

```typescript
// BoardPage.tsx
export const BoardPage = () => {
  useEffect(() => {
    // Page mount → connect
    signalRService.start();
    signalRService.joinBoard();

    signalRService.onTaskCreated((data) => {
      dispatch(taskCreatedFromSignalR(data.task));
    });

    // Page unmount → disconnect
    return () => {
      signalRService.offTaskCreated();
      signalRService.leaveBoard();
      signalRService.stop();
    };
  }, []);
};
```

**문제점:**
- 페이지 이동 시 unmount → disconnect
- 다른 페이지에서 실시간 업데이트 못 받음

### App-Level (App.tsx) - 현재 방식

```typescript
// App.tsx
function App() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Login → connect
    signalRService.start();
    signalRService.joinBoard();

    signalRService.onTaskCreated((data) => {
      dispatch(taskCreatedFromSignalR(data.task));
    });

    // Logout → disconnect
    return () => {
      signalRService.offTaskCreated();
      signalRService.leaveBoard();
      signalRService.stop();
    };
  }, [isAuthenticated]);
}
```

**장점:**
- 페이지 이동과 무관하게 연결 유지
- 어느 페이지에서든 실시간 업데이트 수신

---

## 연결 Lifecycle 비교

```mermaid
graph TB
    subgraph "Page-Level"
        direction TB
        P1[Page Mount] --> P2[Connect]
        P2 --> P3[Listening...]
        P3 --> P4[Page Unmount]
        P4 --> P5[Disconnect]
        P5 -.-> P1
    end

    subgraph "App-Level"
        direction TB
        A1[Login] --> A2[Connect]
        A2 --> A3[Listening...]
        A3 --> A4["Navigate (유지)"]
        A4 --> A3
        A3 --> A5[Logout]
        A5 --> A6[Disconnect]
    end

    style P4 fill:#ffcdd2
    style P5 fill:#ffcdd2
    style A4 fill:#c8e6c9
```

---

## 컴포넌트 책임 분리

### Page-Level (잘못된 책임 분배)

```mermaid
graph TB
    subgraph "BoardPage 책임"
        A[UI 렌더링]
        B[데이터 Fetch]
        C[SignalR 연결 관리]
        D[이벤트 핸들러 등록]
    end

    style C fill:#ffcdd2
    style D fill:#ffcdd2
```

**문제:** BoardPage가 너무 많은 책임을 가짐

### App-Level (적절한 책임 분배)

```mermaid
graph TB
    subgraph "App.tsx 책임"
        A1[SignalR 연결 관리]
        A2[전역 이벤트 핸들러]
    end

    subgraph "BoardPage 책임"
        B1[UI 렌더링]
        B2[데이터 Fetch]
    end

    style A1 fill:#c8e6c9
    style A2 fill:#c8e6c9
    style B1 fill:#bbdefb
    style B2 fill:#bbdefb
```

**장점:** Single Responsibility Principle 준수

---

## 언제 어떤 방식을 사용해야 하는가?

### App-Level 사용 (권장)
- 실시간 업데이트가 앱 전체에서 필요할 때
- 여러 페이지에서 같은 데이터를 공유할 때
- 채팅, 알림, 협업 도구 등

### Page-Level 사용 (특수 케이스)
- 특정 페이지에서만 사용하는 실시간 기능
- 리소스 최적화가 중요할 때 (연결 유지 비용)
- 예: 실시간 주식 차트 (해당 페이지에서만)

---

## 관련 개념

### React Component Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Mounting
    Mounting --> Mounted: render()
    Mounted --> Updating: props/state change
    Updating --> Mounted: re-render
    Mounted --> Unmounting: navigate away
    Unmounting --> [*]
```

### SPA (Single Page Application)
- 페이지 전환 시 전체 새로고침 없음
- React Router가 컴포넌트 mount/unmount 관리
- App 컴포넌트는 항상 마운트 상태

---

## 결론

| 항목 | Page-Level | App-Level |
|------|------------|-----------|
| 연결 지속성 | 페이지별 | 로그인 동안 유지 |
| 실시간 업데이트 | 해당 페이지만 | 전체 앱 |
| 리소스 사용 | 페이지별 연결/해제 | 단일 연결 유지 |
| 적합한 경우 | 특정 페이지 전용 | 전역 실시간 기능 |
| 코드 복잡도 | 페이지마다 중복 | 중앙 집중 관리 |
