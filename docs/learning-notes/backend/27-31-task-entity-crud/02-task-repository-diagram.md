# TaskRepository - Detailed Diagram

## Repository Layer Architecture

```mermaid
flowchart TB
    subgraph INTERFACE["Interface Layer"]
        direction TB
        IRepository["IRepository‹T›<br/>─────────────<br/>«interface»<br/>+GetByIdAsync(id)<br/>+GetAllAsync()<br/>+AddAsync(entity)<br/>+Update(entity)<br/>+Delete(entity)<br/>+ExistsAsync(id)"]

        ITaskRepository["ITaskRepository<br/>─────────────<br/>«interface»<br/>extends IRepository‹TaskItem›<br/>─────────────<br/>+GetPagedAsync(filters)<br/>+GetByCreatorAsync(userId)<br/>+GetByAssigneeAsync(userId)<br/>+GetByIdWithDetailsAsync(id)"]
    end

    subgraph IMPLEMENTATION["Implementation Layer"]
        direction TB
        Repository["Repository‹T›<br/>─────────────<br/>Generic base class<br/>─────────────<br/>-_context: DbContext<br/>-_dbSet: DbSet‹T›"]

        TaskRepository["TaskRepository<br/>─────────────<br/>extends Repository‹TaskItem›<br/>─────────────<br/>+Custom queries<br/>+Eager loading<br/>+Pagination logic"]
    end

    IRepository -.->|"extends"| ITaskRepository
    Repository -->|implements| IRepository
    TaskRepository -->|extends| Repository
    TaskRepository -->|implements| ITaskRepository
```

---

## ITaskRepository Interface

```mermaid
classDiagram
    class IRepository~TaskItem~ {
        <<interface>>
        +GetByIdAsync(int id) Task~TaskItem?~
        +GetAllAsync() Task~IEnumerable~TaskItem~~
        +AddAsync(TaskItem entity) Task
        +Update(TaskItem entity) void
        +Delete(TaskItem entity) void
        +ExistsAsync(int id) Task~bool~
    }

    class ITaskRepository {
        <<interface>>
        +GetPagedAsync(page, pageSize, status?, assignedTo?, createdBy?, search?, includeArchived) Task~Tuple~
        +GetByCreatorAsync(int userId) Task~IEnumerable~TaskItem~~
        +GetByAssigneeAsync(int userId) Task~IEnumerable~TaskItem~~
        +GetByIdWithDetailsAsync(int id) Task~TaskItem?~
    }

    IRepository~TaskItem~ <|-- ITaskRepository : extends
```

---

## TaskRepository Implementation

```mermaid
flowchart TB
    subgraph CLASS["TaskRepository : Repository‹TaskItem›, ITaskRepository"]
        direction TB

        Constructor["Constructor<br/>─────────────<br/>TaskRepository(<br/>  ApplicationDbContext context<br/>) : base(context)"]

        subgraph METHODS["Methods"]
            GetPaged["GetPagedAsync()<br/>─────────────<br/>Paginated list<br/>with filters"]
            GetByCreator["GetByCreatorAsync()<br/>─────────────<br/>Tasks by creator"]
            GetByAssignee["GetByAssigneeAsync()<br/>─────────────<br/>Tasks by assignee"]
            GetWithDetails["GetByIdWithDetailsAsync()<br/>─────────────<br/>Single task with<br/>navigation properties"]
        end

        subgraph INHERITED["Inherited from Repository‹T›"]
            GetById["GetByIdAsync()"]
            GetAll["GetAllAsync()"]
            Add["AddAsync()"]
            Update["Update()"]
            Delete["Delete()"]
            Exists["ExistsAsync()"]
        end
    end

    Constructor --> METHODS
    Constructor --> INHERITED
```

---

## GetPagedAsync - Query Building Flow

```mermaid
flowchart TB
    subgraph INPUT["Method Parameters"]
        P1["int page = 1"]
        P2["int pageSize = 10"]
        P3["TaskStatus? status = null"]
        P4["int? assignedTo = null"]
        P5["int? createdBy = null"]
        P6["string? search = null"]
        P7["bool includeArchived = false"]
    end

    subgraph QUERY["Query Building"]
        direction TB
        Q1["var query = _context.Tasks<br/>.AsQueryable()"]

        Q2["if (!includeArchived)<br/>  .Where(t => !t.IsArchived)"]

        Q3["if (status.HasValue)<br/>  .Where(t => t.Status == status)"]

        Q4["if (assignedTo.HasValue)<br/>  .Where(t => t.AssignedToId == assignedTo)"]

        Q5["if (createdBy.HasValue)<br/>  .Where(t => t.CreatedById == createdBy)"]

        Q6["if (!string.IsNullOrEmpty(search))<br/>  .Where(t => t.Title.Contains(search)<br/>    || t.Description.Contains(search))"]

        Q7[".Include(t => t.CreatedBy)<br/>.Include(t => t.AssignedTo)"]

        Q8["var totalCount = await query.CountAsync()"]

        Q9[".OrderByDescending(t => t.UpdatedAt)<br/>.Skip((page - 1) * pageSize)<br/>.Take(pageSize)<br/>.ToListAsync()"]
    end

    subgraph OUTPUT["Return Value"]
        Result["(IEnumerable‹TaskItem› Items, int TotalCount)"]
    end

    INPUT --> Q1
    Q1 --> Q2 --> Q3 --> Q4 --> Q5 --> Q6 --> Q7 --> Q8 --> Q9
    Q9 --> Result
```

---

## Eager Loading with Include

```mermaid
flowchart LR
    subgraph WITHOUT["Without Include (Lazy Loading)"]
        T1["TaskItem<br/>─────────────<br/>CreatedById = 1<br/>AssignedToId = 2<br/>───────────<br/>CreatedBy = null ❌<br/>AssignedTo = null ❌"]
    end

    subgraph WITH["With Include (Eager Loading)"]
        T2["TaskItem<br/>─────────────<br/>CreatedById = 1<br/>AssignedToId = 2<br/>───────────<br/>CreatedBy = User{...} ✅<br/>AssignedTo = User{...} ✅"]
    end

    subgraph CODE["Code"]
        C1["_context.Tasks<br/>  .Include(t => t.CreatedBy)<br/>  .Include(t => t.AssignedTo)"]
    end

    WITHOUT -->|"Add Include()"| WITH
    CODE -->|"produces"| WITH
```

**Key Point:** Include() loads related entities in a single query (JOIN) instead of separate queries.

---

## Pagination Logic

```mermaid
flowchart TB
    subgraph PARAMS["Parameters"]
        Page["page = 2"]
        Size["pageSize = 10"]
    end

    subgraph DATA["Total Records: 45"]
        direction LR
        R1["1-10<br/>Page 1"]
        R2["11-20<br/>Page 2 ✓"]
        R3["21-30<br/>Page 3"]
        R4["31-40<br/>Page 4"]
        R5["41-45<br/>Page 5"]
    end

    subgraph CALC["Calculation"]
        Skip["Skip = (page - 1) * pageSize<br/>= (2 - 1) * 10<br/>= 10"]
        Take["Take = pageSize<br/>= 10"]
    end

    subgraph SQL["Generated SQL"]
        Query["SELECT * FROM Tasks<br/>ORDER BY UpdatedAt DESC<br/>OFFSET 10 ROWS<br/>FETCH NEXT 10 ROWS ONLY"]
    end

    PARAMS --> CALC
    CALC --> SQL
    SQL --> R2
```

---

## GetByIdWithDetailsAsync Flow

```mermaid
sequenceDiagram
    participant S as TaskService
    participant R as TaskRepository
    participant C as DbContext
    participant DB as Database

    S->>R: GetByIdWithDetailsAsync(5)

    R->>C: _context.Tasks<br/>.Include(t => t.CreatedBy)<br/>.Include(t => t.AssignedTo)<br/>.FirstOrDefaultAsync(t => t.Id == 5)

    Note over C: EF Core generates SQL

    C->>DB: SELECT t.*, u1.*, u2.*<br/>FROM Tasks t<br/>LEFT JOIN Users u1 ON t.CreatedById = u1.Id<br/>LEFT JOIN Users u2 ON t.AssignedToId = u2.Id<br/>WHERE t.Id = 5

    DB-->>C: Result row

    Note over C: EF Core materializes entities

    C-->>R: TaskItem with navigation properties

    R-->>S: TaskItem { CreatedBy: User, AssignedTo: User }
```

---

## Repository Pattern Benefits

```mermaid
flowchart TB
    subgraph BENEFITS["Why Repository Pattern?"]
        direction TB

        B1["Abstraction<br/>───────────<br/>Service layer doesn't know<br/>about EF Core/DbContext"]

        B2["Testability<br/>───────────<br/>Mock ITaskRepository<br/>in unit tests"]

        B3["Single Responsibility<br/>───────────<br/>Repository = data access<br/>Service = business logic"]

        B4["Centralized Queries<br/>───────────<br/>Complex queries in<br/>one place"]
    end

    subgraph EXAMPLE["Without vs With"]
        direction LR

        Without["❌ Service directly uses DbContext<br/>───────────<br/>_context.Tasks<br/>  .Where(t => t.Status == status)<br/>  .Include(t => t.CreatedBy)<br/>  .ToListAsync()"]

        With["✅ Service uses Repository<br/>───────────<br/>_taskRepository<br/>  .GetPagedAsync(1, 10, status)"]
    end

    BENEFITS --> EXAMPLE
```

---

## UnitOfWork Integration

```mermaid
flowchart TB
    subgraph UOW["UnitOfWork"]
        direction TB
        IUoW["IUnitOfWork<br/>─────────────<br/>+Users: IUserRepository<br/>+Tasks: ITaskRepository<br/>+SaveChangesAsync()"]

        UoWImpl["UnitOfWork<br/>─────────────<br/>-_context<br/>-_userRepository<br/>-_taskRepository"]
    end

    subgraph REPOS["Repositories"]
        UserRepo["IUserRepository"]
        TaskRepo["ITaskRepository"]
    end

    subgraph SERVICE["TaskService"]
        Svc["private readonly IUnitOfWork _unitOfWork<br/>───────────<br/>_unitOfWork.Tasks.GetPagedAsync()<br/>_unitOfWork.Tasks.AddAsync()<br/>_unitOfWork.SaveChangesAsync()"]
    end

    UoWImpl -->|exposes| UserRepo
    UoWImpl -->|exposes| TaskRepo
    SERVICE -->|uses| IUoW
    IUoW -->|provides| TaskRepo
```

---

## Query Filter Chain

```mermaid
flowchart LR
    subgraph QUERY["IQueryable‹TaskItem› Pipeline"]
        direction LR
        Q1["_context.Tasks"]
        Q2[".Where(archived)"]
        Q3[".Where(status)"]
        Q4[".Where(assignedTo)"]
        Q5[".Where(createdBy)"]
        Q6[".Where(search)"]
        Q7[".Include()"]
        Q8[".OrderBy()"]
        Q9[".Skip().Take()"]
        Q10[".ToListAsync()"]
    end

    Q1 --> Q2 --> Q3 --> Q4 --> Q5 --> Q6 --> Q7 --> Q8 --> Q9 --> Q10

    Note1["Deferred Execution:<br/>Query not executed until ToListAsync()"]
    Note2["Filters applied only if<br/>parameter has value"]
```

**Concept:** IQueryable uses deferred execution - filters are composed into a single SQL query, not executed until enumeration.

---

## Return Tuple Pattern

```mermaid
flowchart TB
    subgraph METHOD["GetPagedAsync Return Type"]
        Return["Task‹(IEnumerable‹TaskItem› Items, int TotalCount)›"]
    end

    subgraph USAGE["Usage in Service"]
        Code["var (items, totalCount) = await<br/>  _unitOfWork.Tasks.GetPagedAsync(...);<br/><br/>return new TaskListResponseDto<br/>{<br/>  Items = items.Select(MapToDto),<br/>  TotalCount = totalCount,<br/>  Page = page,<br/>  PageSize = pageSize<br/>};"]
    end

    subgraph WHY["Why Tuple?"]
        Reason1["Need both data AND count"]
        Reason2["Count for pagination UI<br/>(total pages calculation)"]
        Reason3["Single query for count<br/>before pagination applied"]
    end

    METHOD --> USAGE
    WHY --> METHOD
```
