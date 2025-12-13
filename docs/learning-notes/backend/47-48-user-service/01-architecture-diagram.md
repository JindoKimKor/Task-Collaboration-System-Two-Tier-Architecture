# Architecture Diagram

## Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant UC as UsersController
    participant US as UserService
    participant UoW as IUnitOfWork
    participant UR as UserRepository
    participant DB as Database

    Note over C,DB: GET /api/users

    C->>UC: GET /api/users<br/>[Authorization: Bearer JWT]
    UC->>US: GetAllUsersAsync()
    US->>UoW: Users.GetAllAsync()
    UoW->>UR: GetAllAsync()
    UR->>DB: SELECT * FROM Users
    DB-->>UR: User[]
    UR-->>UoW: IEnumerable<User>
    UoW-->>US: IEnumerable<User>
    US->>US: Map to UserListItemDto[]<br/>(with GetInitials)
    US-->>UC: IEnumerable<UserListItemDto>
    UC-->>C: 200 OK + JSON array
```

---

## Layer Architecture

```mermaid
flowchart TB
    subgraph PRESENTATION["Presentation Layer"]
        direction TB
        UC["UsersController<br/>───────────<br/>[Authorize]<br/>GET /api/users<br/>GET /api/users/{id}"]
    end

    subgraph APPLICATION["Application Layer"]
        direction TB
        IUS["IUserService<br/>───────────<br/>«interface»"]
        US["UserService<br/>───────────<br/>GetAllUsersAsync()<br/>GetUserByIdAsync()<br/>GetInitials()"]
    end

    subgraph DATA["Data Layer (Existing)"]
        direction TB
        UoW["IUnitOfWork<br/>───────────<br/>Users: IUserRepository<br/>Tasks: ITaskRepository"]
        IUR["IUserRepository<br/>───────────<br/>«interface»"]
        UR["UserRepository<br/>───────────<br/>GetAllAsync()<br/>GetByIdAsync()"]
    end

    UC -->|"injects"| IUS
    US -->|implements| IUS
    US -->|"injects"| UoW
    UoW -->|"exposes"| IUR
    UR -->|implements| IUR
```

---

## File Structure

```
Backend/TaskCollaborationApp.API/
├── Controllers/
│   ├── DTOs/
│   │   ├── Task/
│   │   │   └── UserSummaryDto.cs      (existing, similar structure)
│   │   └── User/                       (NEW folder)
│   │       ├── UserListItemDto.cs     (NEW)
│   │       └── UserResponseDto.cs     (NEW)
│   ├── TasksController.cs             (existing, pattern reference)
│   └── UsersController.cs             (NEW)
├── Services/
│   ├── Interfaces/
│   │   ├── ITaskService.cs            (existing, pattern reference)
│   │   └── IUserService.cs            (NEW)
│   ├── TaskService.cs                 (existing, pattern reference)
│   └── UserService.cs                 (NEW)
└── Program.cs                         (MODIFIED - add DI)
```

---

## DTO Relationships

```mermaid
flowchart LR
    subgraph ENTITY["Entity (Data Layer)"]
        User["User<br/>───────────<br/>Id: int<br/>Name: string<br/>Email: string<br/>PasswordHash: string<br/>Role: string<br/>RefreshToken: string?<br/>CreatedAt: DateTime"]
    end

    subgraph DTOS["DTOs (Presentation Layer)"]
        ListItem["UserListItemDto<br/>───────────<br/>Id: int<br/>Name: string<br/>Initials: string"]

        Response["UserResponseDto<br/>───────────<br/>Id: int<br/>Name: string<br/>Email: string<br/>Initials: string<br/>CreatedAt: DateTime"]
    end

    User -->|"map (list)"| ListItem
    User -->|"map (detail)"| Response

    style ListItem fill:#e1f5fe
    style Response fill:#e8f5e9
```

---

## Comparison: UserSummaryDto vs UserListItemDto

```mermaid
flowchart TB
    subgraph EXISTING["Existing (Task Domain)"]
        UserSummary["UserSummaryDto<br/>───────────<br/>Namespace: DTOs.Task<br/>Used in: TaskResponseDto<br/>───────────<br/>Id, Name, Initials"]
    end

    subgraph NEW["New (User Domain)"]
        UserListItem["UserListItemDto<br/>───────────<br/>Namespace: DTOs.User<br/>Used in: GET /api/users<br/>───────────<br/>Id, Name, Initials"]
    end

    Note["Same structure,<br/>different domains<br/>(SRP - each domain owns its DTOs)"]

    EXISTING -.->|"same properties"| NEW
```

**Why separate DTOs?**
- Single Responsibility: Each domain owns its DTOs
- Future flexibility: User domain may add properties later
- Clear namespace organization
