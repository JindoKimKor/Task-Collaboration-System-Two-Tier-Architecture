# SignalR Architecture Evolution - Story #53

## 개요

이 문서는 Story #50 (기본 설정)에서 Story #53 (실시간 알림)으로 발전하면서 SignalR 아키텍처가 어떻게 변화했는지 설명합니다.

---

## 아키텍처 발전 요약

```mermaid
flowchart LR
    subgraph Story50 ["Story #50: Basic Setup"]
        A1["TaskHub<br/>JoinBoard/LeaveBoard"]
        A2["signalRService<br/>Connection Only"]
        A3["BoardPage<br/>Connect on Mount"]
    end

    subgraph Story53 ["Story #53: Real-time Notifications"]
        B1["TaskHub<br/>+ IHubContext"]
        B2["NotificationService<br/>Broadcast Events"]
        B3["TaskService<br/>Trigger Notifications"]
        B4["App.tsx<br/>Global Connection"]
        B5["taskSlice<br/>SignalR Reducers"]
    end

    Story50 -->|"Evolution"| Story53
```

---

## Before vs After 비교

### 1. 전체 시스템 아키텍처

#### Before (Story #50)

```mermaid
flowchart TB
    subgraph Frontend
        BoardPage["BoardPage<br/>SignalR Connection"]
        Service["signalRService<br/>start/stop/join/leave"]
    end

    subgraph Backend
        Hub["TaskHub<br/>JoinBoard/LeaveBoard"]
    end

    BoardPage --> Service
    Service <-->|WebSocket| Hub

    style Hub fill:#c8e6c9
    style Service fill:#bbdefb
    style BoardPage fill:#fff9c4
```

**특징:**
- Hub는 연결 관리만 담당
- 클라이언트 → 서버 방향만 가능
- 실제 데이터 브로드캐스트 없음

#### After (Story #53)

```mermaid
flowchart TB
    subgraph Frontend
        App["App.tsx<br/>Global SignalR Manager"]
        Service["signalRService<br/>+ Event Handlers"]
        Slice["taskSlice<br/>SignalR Reducers"]
        Board["BoardPage<br/>UI Only"]
    end

    subgraph Backend
        Controller["TaskController"]
        TaskService["TaskService<br/>+ INotificationService"]
        NotifService["NotificationService<br/>IHubContext"]
        Hub["TaskHub<br/>Group Management"]
    end

    App --> Service
    Service -->|Events| Slice
    Slice --> Board

    Controller --> TaskService
    TaskService --> NotifService
    NotifService -->|SendAsync| Hub
    Hub <-->|WebSocket| Service

    style NotifService fill:#ffecb3
    style TaskService fill:#c8e6c9
    style App fill:#fff9c4
    style Slice fill:#bbdefb
```

**변화:**
- Server → Client 브로드캐스트 추가
- NotificationService로 Hub 외부에서 메시지 전송
- App-Level 연결 관리로 안정성 향상
- Redux 통합으로 상태 자동 업데이트

---

### 2. 연결 관리 위치 변화

#### Before: Page-Level

```mermaid
sequenceDiagram
    participant User
    participant BoardPage
    participant CreatePage
    participant SignalR

    User->>BoardPage: Navigate
    BoardPage->>SignalR: connect()
    Note over SignalR: Connected

    User->>CreatePage: Navigate
    BoardPage->>SignalR: disconnect()
    Note over SignalR: Disconnected!

    Note over User: Missed events!
```

#### After: App-Level

```mermaid
sequenceDiagram
    participant User
    participant App
    participant BoardPage
    participant CreatePage
    participant SignalR

    User->>App: Login
    App->>SignalR: connect()
    Note over SignalR: Connected

    User->>BoardPage: Navigate
    Note over SignalR: Still Connected

    User->>CreatePage: Navigate
    Note over SignalR: Still Connected

    Note over User: Never miss events!

    User->>App: Logout
    App->>SignalR: disconnect()
```

---

### 3. 메시지 흐름 변화

#### Before: 연결만 가능

```mermaid
flowchart LR
    Client["Client"]
    Hub["TaskHub"]

    Client -->|"JoinBoard()"| Hub
    Client -->|"LeaveBoard()"| Hub

    style Hub fill:#e0e0e0
```

**한계:** Hub에서 클라이언트로 메시지 전송 불가

#### After: 양방향 통신

```mermaid
flowchart TB
    subgraph ClientToServer ["Client → Server"]
        C1["JoinBoard()"]
        C2["LeaveBoard()"]
    end

    subgraph ServerToClient ["Server → Client"]
        S1["TaskCreated"]
        S2["TaskUpdated"]
        S3["TaskDeleted"]
        S4["TaskAssigned"]
    end

    Hub["TaskHub"]

    C1 --> Hub
    C2 --> Hub
    Hub --> S1
    Hub --> S2
    Hub --> S3
    Hub --> S4

    style ServerToClient fill:#c8e6c9
    style ClientToServer fill:#bbdefb
```

---

### 4. 백엔드 레이어 변화

#### Before: Hub만 존재

```
Controllers/
  TaskController.cs     ← CRUD만
Hubs/
  TaskHub.cs            ← 연결 관리만
```

#### After: Notification Layer 추가

```
Controllers/
  TaskController.cs
Services/
  TaskService.cs        ← INotificationService 주입
  Interfaces/
    INotificationService.cs   ← 새로 추가
  NotificationService.cs      ← 새로 추가 (IHubContext 사용)
Hubs/
  TaskHub.cs            ← 변경 없음
```

```mermaid
flowchart TB
    subgraph Before
        BC["TaskController"] --> BH["TaskHub"]
    end

    subgraph After
        AC["TaskController"]
        AS["TaskService"]
        AN["NotificationService"]
        AH["TaskHub"]

        AC --> AS
        AS --> AN
        AN -->|IHubContext| AH
    end

    Before -->|Evolution| After

    style AN fill:#ffecb3
    style AS fill:#c8e6c9
```

---

### 5. 프론트엔드 상태 관리 변화

#### Before: 수동 Refresh 필요

```mermaid
sequenceDiagram
    participant UserA as User A
    participant UserB as User B
    participant API
    participant Redux

    UserA->>API: Create Task
    API-->>UserA: Success
    Note over UserA: See new task

    Note over UserB: Does NOT see new task
    UserB->>UserB: Manual refresh needed!
    UserB->>API: GET /tasks
    API-->>UserB: Task list
    Note over UserB: Now sees new task
```

#### After: 자동 실시간 업데이트

```mermaid
sequenceDiagram
    participant UserA as User A
    participant UserB as User B
    participant API
    participant SignalR
    participant Redux

    UserA->>API: Create Task
    API->>SignalR: TaskCreated event
    SignalR->>UserA: TaskCreated
    SignalR->>UserB: TaskCreated
    UserA->>Redux: dispatch(taskCreatedFromSignalR)
    UserB->>Redux: dispatch(taskCreatedFromSignalR)
    Note over UserA,UserB: Both see new task instantly!
```

---

## 새로 추가된 컴포넌트

### Backend

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| INotificationService | `Services/Interfaces/` | 알림 서비스 인터페이스 |
| NotificationService | `Services/` | IHubContext로 브로드캐스트 |
| TaskService 수정 | `Services/` | CRUD 시 알림 호출 |
| Program.cs 수정 | - | DI 등록, JWT SignalR 설정 |

### Frontend

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| Event Handlers | `signalRService.ts` | on*/off* 메서드 |
| SignalR Reducers | `taskSlice.ts` | taskCreatedFromSignalR 등 |
| Global Connection | `App.tsx` | isAuthenticated 기반 연결 |

---

## 해결한 문제들

### 1. 페이지 이동 시 연결 끊김

| 항목 | Before | After |
|------|--------|-------|
| 연결 위치 | BoardPage | App.tsx |
| 연결 시점 | 페이지 마운트 | 로그인 |
| 해제 시점 | 페이지 언마운트 | 로그아웃 |
| 문제 | 이벤트 누락 | 해결됨 |

### 2. Hub 외부에서 메시지 전송 불가

| 항목 | Before | After |
|------|--------|-------|
| 메시지 전송 | Hub 내부만 | 어디서든 가능 |
| 방법 | - | IHubContext DI |
| 위치 | - | NotificationService |

### 3. camelCase/PascalCase 불일치

| 항목 | Before | After |
|------|--------|-------|
| 인지 | 몰랐음 | 이해함 |
| 타입 정의 | PascalCase | camelCase |
| 데이터 접근 | data.Task | data.task |

---

## 아키텍처 원칙 적용

### SOLID 원칙

| 원칙 | 적용 |
|------|------|
| **S**ingle Responsibility | NotificationService는 알림만 담당 |
| **O**pen/Closed | INotificationService로 확장 가능 |
| **L**iskov Substitution | 인터페이스 기반 DI |
| **I**nterface Segregation | INotificationService 분리 |
| **D**ependency Inversion | TaskService → INotificationService |

### 디자인 패턴

| 패턴 | 적용 위치 |
|------|----------|
| Observer | SignalR 이벤트 리스너 |
| Singleton | HubConnection 인스턴스 |
| Mediator | App.tsx (SignalR ↔ Redux 중재) |
| Pub-Sub | SignalR Group 브로드캐스트 |

---

## 성능 및 확장성

### Story #50 한계
- 연결/해제 반복으로 오버헤드
- 실시간 데이터 없음 (폴링 필요)

### Story #53 개선
- 단일 연결 유지 (리소스 절약)
- 실시간 푸시 (폴링 불필요)
- Scale-out 가능 (Redis Backplane 추가 시)

```mermaid
flowchart TB
    subgraph ScaleOut ["Scale-Out (향후)"]
        Server1["Server 1"]
        Server2["Server 2"]
        Redis["Redis Backplane"]

        Server1 <--> Redis
        Server2 <--> Redis
    end

    subgraph Current ["현재 구조"]
        SingleServer["Single Server"]
        InMemory["In-Memory Groups"]

        SingleServer --> InMemory
    end

    Current -->|"Ready for"| ScaleOut
```

---

## 향후 발전 방향

| 기능 | 설명 | 복잡도 |
|------|------|--------|
| 개인 알림 | 특정 사용자에게만 전송 | 낮음 |
| 알림 UI | 토스트/뱃지 표시 | 중간 |
| 알림 기록 | DB 저장 및 조회 | 중간 |
| Redis Backplane | 다중 서버 지원 | 높음 |
| 오프라인 지원 | 재연결 시 누락 이벤트 전송 | 높음 |

---

## 관련 문서

| 문서 | 경로 |
|------|------|
| 기본 인프라 | `signalr-basic-setup-infrastructure.md` |
| App vs Page Level | `01-app-level-vs-page-level.md` |
| camelCase 직렬화 | `02-camelcase-serialization.md` |
| Frontend Task #56 | `frontend/56-signalr-event-handling/` |

---

## Changelog

| Story | Task | 변경 내용 |
|-------|------|----------|
| #50 | #51 | TaskHub 생성, Program.cs 설정 |
| #50 | #52 | signalRService.ts, BoardPage 연결 |
| #53 | #54 | INotificationService 인터페이스 |
| #53 | #55 | NotificationService, TaskService 연동 |
| #53 | #56 | Frontend Event Handlers, Redux 통합 |
| #53 | - | App-Level 연결, camelCase 수정 |
