# TaskService - Detailed Diagram

## Service Layer Architecture

```mermaid
flowchart TB
    subgraph INTERFACE["Interface"]
        ITaskService["ITaskService<br/>─────────────<br/>«interface»<br/>+GetTasksAsync()<br/>+GetMyTasksAsync()<br/>+GetAssignedTasksAsync()<br/>+GetTaskByIdAsync()<br/>+CreateTaskAsync()<br/>+UpdateTaskAsync()<br/>+DeleteTaskAsync()"]
    end

    subgraph IMPLEMENTATION["Implementation"]
        TaskService["TaskService<br/>─────────────<br/>-_unitOfWork: IUnitOfWork<br/>─────────────<br/>+Business Logic<br/>+Authorization<br/>+DTO ↔ Entity Mapping"]
    end

    subgraph DEPENDENCIES["Dependencies"]
        UoW["IUnitOfWork<br/>─────────────<br/>+Tasks: ITaskRepository<br/>+Users: IUserRepository<br/>+SaveChangesAsync()"]
    end

    TaskService -->|implements| ITaskService
    TaskService -->|uses| UoW
```

---

## ITaskService Interface Methods

```mermaid
classDiagram
    class ITaskService {
        <<interface>>
        +GetTasksAsync(page, pageSize, status?, assignedTo?, createdBy?, search?) Task~TaskListResponseDto~
        +GetMyTasksAsync(userId, page, pageSize) Task~TaskListResponseDto~
        +GetAssignedTasksAsync(userId, page, pageSize) Task~TaskListResponseDto~
        +GetTaskByIdAsync(id) Task~TaskResponseDto?~
        +CreateTaskAsync(request, createdById) Task~TaskResponseDto~
        +UpdateTaskAsync(id, request, userId) Task~TaskResponseDto~
        +DeleteTaskAsync(id, userId) Task
    }
```

---

## TaskService Dependencies

```mermaid
flowchart TB
    subgraph SERVICE["TaskService"]
        direction TB
        Constructor["Constructor<br/>─────────────<br/>TaskService(IUnitOfWork unitOfWork)<br/>{<br/>  _unitOfWork = unitOfWork;<br/>}"]

        Field["private readonly IUnitOfWork _unitOfWork"]
    end

    subgraph UOW["IUnitOfWork"]
        Tasks["Tasks: ITaskRepository"]
        Users["Users: IUserRepository"]
        Save["SaveChangesAsync()"]
    end

    SERVICE -->|injects| UOW
    Field -->|accesses| Tasks
    Field -->|accesses| Save
```

---

## CreateTaskAsync Flow

```mermaid
sequenceDiagram
    participant C as Controller
    participant S as TaskService
    participant R as TaskRepository
    participant DB as Database

    C->>S: CreateTaskAsync(request, userId=3)

    Note over S: Map DTO → Entity

    S->>S: var taskItem = new TaskItem {<br/>  Title = request.Title,<br/>  Description = request.Description,<br/>  Status = request.Status ?? TaskStatus.ToDo,<br/>  CreatedById = userId,<br/>  AssignedToId = request.AssignedToId,<br/>  CreatedAt = DateTime.UtcNow,<br/>  UpdatedAt = DateTime.UtcNow,<br/>  IsArchived = false<br/>}

    S->>R: AddAsync(taskItem)
    R->>DB: Track entity (pending INSERT)

    S->>R: SaveChangesAsync()
    R->>DB: INSERT INTO Tasks (...)

    Note over DB: Id generated

    DB-->>R: taskItem.Id = 8

    S->>R: GetByIdWithDetailsAsync(8)
    R->>DB: SELECT with JOIN
    DB-->>R: TaskItem with User details
    R-->>S: TaskItem

    S->>S: MapToResponseDto(taskItem)

    S-->>C: TaskResponseDto
```

---

## UpdateTaskAsync Flow with Authorization

```mermaid
flowchart TB
    subgraph INPUT["Input"]
        Params["id = 5<br/>request = UpdateTaskRequestDto<br/>userId = 3"]
    end

    subgraph FETCH["1. Fetch Task"]
        Query["await _unitOfWork.Tasks.GetByIdAsync(5)"]
        Check1{{"task == null?"}}
        Error1["throw KeyNotFoundException<br/>→ 404 Not Found"]
    end

    subgraph AUTH["2. Authorization Check"]
        AuthCheck["var userRole = await GetUserRole(userId)"]
        Condition{{"task.CreatedById == userId<br/>OR userRole == 'Admin'?"}}
        Error2["throw UnauthorizedAccessException<br/>→ 403 Forbidden"]
    end

    subgraph UPDATE["3. Apply Updates"]
        direction TB
        U1["if (request.Title != null)<br/>  task.Title = request.Title"]
        U2["if (request.Description != null)<br/>  task.Description = request.Description"]
        U3["if (request.Status.HasValue)<br/>  task.Status = request.Status.Value"]
        U4["if (request.AssignedToId.HasValue)<br/>  task.AssignedToId = request.AssignedToId"]
        U5["if (request.IsArchived.HasValue)<br/>  task.IsArchived = request.IsArchived.Value"]
        U6["task.UpdatedAt = DateTime.UtcNow"]
    end

    subgraph SAVE["4. Save & Return"]
        Save["_unitOfWork.Tasks.Update(task)<br/>await _unitOfWork.SaveChangesAsync()"]
        Reload["await GetByIdWithDetailsAsync(id)"]
        Map["MapToResponseDto(task)"]
        Return["return TaskResponseDto"]
    end

    INPUT --> Query
    Query --> Check1
    Check1 -->|Yes| Error1
    Check1 -->|No| AuthCheck
    AuthCheck --> Condition
    Condition -->|No| Error2
    Condition -->|Yes| U1
    U1 --> U2 --> U3 --> U4 --> U5 --> U6
    U6 --> Save --> Reload --> Map --> Return
```

---

## DeleteTaskAsync Flow

```mermaid
sequenceDiagram
    participant C as Controller
    participant S as TaskService
    participant R as TaskRepository
    participant DB as Database

    C->>S: DeleteTaskAsync(5, userId=3)

    S->>R: GetByIdAsync(5)
    R->>DB: SELECT * FROM Tasks WHERE Id = 5
    DB-->>R: TaskItem

    alt Task not found
        R-->>S: null
        S-->>C: throw KeyNotFoundException
        Note over C: Returns 404 Not Found
    end

    S->>S: Get user role

    alt Not authorized (not creator AND not admin)
        S-->>C: throw UnauthorizedAccessException
        Note over C: Returns 403 Forbidden
    end

    S->>R: Delete(task)
    Note over R: _context.Tasks.Remove(task)

    S->>R: SaveChangesAsync()
    R->>DB: DELETE FROM Tasks WHERE Id = 5

    S-->>C: (void - success)
    Note over C: Returns 204 No Content
```

---

## DTO ↔ Entity Mapping

```mermaid
flowchart LR
    subgraph REQUEST["Request DTO"]
        Create["CreateTaskRequestDto<br/>─────────────<br/>Title: 'New Task'<br/>Description: '...'<br/>Status: null<br/>AssignedToId: 2"]
    end

    subgraph ENTITY["Entity"]
        Task["TaskItem<br/>─────────────<br/>Id: (auto)<br/>Title: 'New Task'<br/>Description: '...'<br/>Status: ToDo (default)<br/>CreatedById: 3<br/>AssignedToId: 2<br/>CreatedAt: (now)<br/>UpdatedAt: (now)<br/>IsArchived: false"]
    end

    subgraph RESPONSE["Response DTO"]
        Response["TaskResponseDto<br/>─────────────<br/>Id: 8<br/>Title: 'New Task'<br/>Description: '...'<br/>Status: 'ToDo'<br/>CreatedBy: UserSummaryDto<br/>AssignedTo: UserSummaryDto<br/>CreatedAt: '...'<br/>UpdatedAt: '...'<br/>IsArchived: false"]
    end

    REQUEST -->|"CreateTaskAsync()"| ENTITY
    ENTITY -->|"MapToResponseDto()"| RESPONSE
```

---

## MapToResponseDto Method

```mermaid
flowchart TB
    subgraph INPUT["TaskItem (with navigation)"]
        Task["TaskItem<br/>─────────────<br/>Id = 8<br/>Title = 'Design API'<br/>CreatedBy = User { Id=3, Name='John' }<br/>AssignedTo = User { Id=2, Name='Jane' }"]
    end

    subgraph MAPPING["Mapping Logic"]
        Code["private TaskResponseDto MapToResponseDto(TaskItem task)<br/>{<br/>  return new TaskResponseDto<br/>  {<br/>    Id = task.Id,<br/>    Title = task.Title,<br/>    Description = task.Description,<br/>    Status = task.Status.ToString(),<br/>    CreatedBy = MapToUserSummary(task.CreatedBy),<br/>    AssignedTo = task.AssignedTo != null<br/>                 ? MapToUserSummary(task.AssignedTo)<br/>                 : null,<br/>    CreatedAt = task.CreatedAt,<br/>    UpdatedAt = task.UpdatedAt,<br/>    IsArchived = task.IsArchived<br/>  };<br/>}"]
    end

    subgraph OUTPUT["TaskResponseDto"]
        Response["TaskResponseDto<br/>─────────────<br/>Id = 8<br/>Title = 'Design API'<br/>Status = 'ToDo'<br/>CreatedBy = { Id=3, Name='John' }<br/>AssignedTo = { Id=2, Name='Jane' }"]
    end

    INPUT --> MAPPING --> OUTPUT
```

---

## Authorization Logic

```mermaid
flowchart TB
    subgraph CHECK["Authorization Check"]
        direction TB
        Start["UpdateTaskAsync / DeleteTaskAsync"]
        GetTask["Get task from database"]
        GetRole["Get user's role"]

        Condition1{{"task.CreatedById == userId?"}}
        Condition2{{"userRole == 'Admin'?"}}

        Allowed["✅ Authorized<br/>Continue operation"]
        Denied["❌ Not Authorized<br/>throw UnauthorizedAccessException"]
    end

    Start --> GetTask --> GetRole --> Condition1
    Condition1 -->|Yes| Allowed
    Condition1 -->|No| Condition2
    Condition2 -->|Yes| Allowed
    Condition2 -->|No| Denied
```

**Rules:**
- Creator can always modify/delete their own task
- Admin can modify/delete any task
- Other users cannot modify/delete tasks they didn't create

---

## GetTasksAsync - Pagination Response

```mermaid
flowchart TB
    subgraph METHOD["GetTasksAsync(page=2, pageSize=10, ...)"]
        direction TB
        Call["var (items, totalCount) =<br/>  await _unitOfWork.Tasks.GetPagedAsync(...)"]

        Map["var dtos = items.Select(MapToResponseDto)"]

        Build["return new TaskListResponseDto<br/>{<br/>  Items = dtos,<br/>  TotalCount = totalCount,<br/>  Page = page,<br/>  PageSize = pageSize<br/>}"]
    end

    subgraph RESPONSE["TaskListResponseDto"]
        Result["Items: TaskResponseDto[10]<br/>TotalCount: 45<br/>Page: 2<br/>PageSize: 10<br/>───────────<br/>Frontend can calculate:<br/>TotalPages = ceil(45/10) = 5"]
    end

    METHOD --> RESPONSE
```

---

## Error Handling Strategy

```mermaid
flowchart TB
    subgraph SERVICE["TaskService"]
        direction TB
        NotFound["Task not found<br/>───────────<br/>throw KeyNotFoundException"]
        NotAuth["Not authorized<br/>───────────<br/>throw UnauthorizedAccessException"]
    end

    subgraph CONTROLLER["TasksController"]
        direction TB
        Catch1["catch (KeyNotFoundException)<br/>───────────<br/>return NotFound()"]
        Catch2["catch (UnauthorizedAccessException)<br/>───────────<br/>return Forbid()"]
    end

    subgraph HTTP["HTTP Response"]
        R404["404 Not Found"]
        R403["403 Forbidden"]
    end

    NotFound --> Catch1 --> R404
    NotAuth --> Catch2 --> R403
```

**Pattern:** Service throws specific exceptions, Controller catches and converts to HTTP status codes.

---

## Service Layer Benefits

```mermaid
flowchart TB
    subgraph BENEFITS["Why Service Layer?"]
        B1["Business Logic Isolation<br/>───────────<br/>Authorization, validation,<br/>complex operations"]

        B2["Reusability<br/>───────────<br/>Same logic for API,<br/>SignalR, background jobs"]

        B3["Testability<br/>───────────<br/>Mock IUnitOfWork<br/>Test business logic alone"]

        B4["Thin Controllers<br/>───────────<br/>Controllers only handle<br/>HTTP concerns"]
    end

    subgraph FLOW["Clean Architecture Flow"]
        Controller["Controller<br/>───────────<br/>HTTP In/Out"]
        Service["Service<br/>───────────<br/>Business Logic"]
        Repository["Repository<br/>───────────<br/>Data Access"]

        Controller -->|"calls"| Service
        Service -->|"uses"| Repository
    end

    BENEFITS --> FLOW
```
