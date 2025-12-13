# Task #56: SignalR Event Handling - Architecture Diagram

## 전체 실시간 업데이트 흐름

```mermaid
sequenceDiagram
    participant UserA as User A (Browser)
    participant UserB as User B (Browser)
    participant Frontend as React App
    participant Redux as Redux Store
    participant SignalR as SignalR Client
    participant Hub as SignalR Hub
    participant API as ASP.NET API
    participant Service as NotificationService
    participant DB as Database

    Note over UserA,DB: User A creates a new task

    UserA->>Frontend: Click "Create Task"
    Frontend->>API: POST /api/tasks
    API->>DB: Insert Task
    DB-->>API: Task Created
    API->>Service: NotifyTaskCreatedAsync(task)
    Service->>Hub: SendAsync("TaskCreated", data)

    Note over Hub,UserB: SignalR broadcasts to all connected clients

    Hub-->>SignalR: TaskCreated event (User A)
    Hub-->>SignalR: TaskCreated event (User B)

    SignalR->>Redux: dispatch(taskCreatedFromSignalR)
    Redux->>Frontend: State Updated
    Frontend->>UserA: UI Re-render (새 Task 표시)
    Frontend->>UserB: UI Re-render (새 Task 표시)
```

## App-Level SignalR Connection 아키텍처

```mermaid
graph TB
    subgraph "React Application"
        App[App.tsx]
        Router[AppRouter]

        subgraph "Pages"
            Board[BoardPage]
            Create[CreateTaskPage]
            Details[TaskDetailsPage]
        end

        subgraph "Redux Store"
            AuthState[auth.isAuthenticated]
            TaskState[task.tasks]
        end

        subgraph "Services"
            SignalRService[signalRService]
        end
    end

    subgraph "Backend"
        Hub[TaskHub]
        NotificationService[NotificationService]
    end

    App -->|useEffect| SignalRService
    App -->|watches| AuthState
    SignalRService <-->|WebSocket| Hub

    Router --> Board
    Router --> Create
    Router --> Details

    SignalRService -->|dispatch| TaskState
    TaskState -->|useAppSelector| Board
    TaskState -->|useAppSelector| Details

    NotificationService -->|SendAsync| Hub

    style App fill:#e1f5fe
    style SignalRService fill:#fff3e0
    style Hub fill:#e8f5e9
```

## SignalR Event → Redux Action 데이터 흐름

```mermaid
flowchart LR
    subgraph Backend
        A[NotificationService] -->|SendAsync| B[TaskHub]
    end

    subgraph Network
        B -->|WebSocket| C[SignalR Client]
    end

    subgraph Frontend
        C -->|on 'TaskCreated'| D[Event Handler]
        D -->|dispatch| E[taskSlice reducer]
        E -->|state update| F[React Components]
    end

    style A fill:#c8e6c9
    style B fill:#c8e6c9
    style C fill:#fff9c4
    style D fill:#bbdefb
    style E fill:#bbdefb
    style F fill:#bbdefb
```

## 파일 구조 및 책임

```mermaid
graph TB
    subgraph "Entry Point"
        App[App.tsx<br/>SignalR Lifecycle]
    end

    subgraph "Service Layer"
        SignalR[signalRService.ts<br/>Connection & Events]
    end

    subgraph "State Layer"
        Slice[taskSlice.ts<br/>SignalR Reducers]
        Thunks[taskThunks.ts<br/>API Calls]
    end

    subgraph "UI Layer"
        Board[BoardPage.tsx]
        Kanban[KanbanBoard.tsx]
    end

    App -->|start/stop| SignalR
    App -->|on*/off*| SignalR
    App -->|dispatch| Slice

    SignalR -->|WebSocket| Backend((Backend))

    Board -->|useAppSelector| Slice
    Board -->|dispatch| Thunks
    Kanban -->|props| Board

    style App fill:#ffecb3
    style SignalR fill:#c5cae9
    style Slice fill:#b2dfdb
```

## useEffect Lifecycle 흐름

```mermaid
stateDiagram-v2
    [*] --> AppMount: App Component Mounted

    AppMount --> CheckAuth: useEffect runs
    CheckAuth --> NotAuthenticated: isAuthenticated = false
    CheckAuth --> Authenticated: isAuthenticated = true

    NotAuthenticated --> [*]: Return early

    Authenticated --> Connect: signalRService.start()
    Connect --> JoinBoard: signalRService.joinBoard()
    JoinBoard --> RegisterHandlers: Register event handlers
    RegisterHandlers --> Listening: Waiting for events

    Listening --> HandleEvent: Event received
    HandleEvent --> Dispatch: dispatch(action)
    Dispatch --> Listening: Continue listening

    Listening --> Cleanup: isAuthenticated changes to false
    Cleanup --> RemoveHandlers: off* methods
    RemoveHandlers --> LeaveBoard: signalRService.leaveBoard()
    LeaveBoard --> Disconnect: signalRService.stop()
    Disconnect --> [*]
```
