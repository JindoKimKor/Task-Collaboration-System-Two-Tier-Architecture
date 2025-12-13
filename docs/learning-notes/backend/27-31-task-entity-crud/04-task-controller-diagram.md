# TasksController - Detailed Diagram

## Controller Architecture

```mermaid
flowchart TB
    subgraph ATTRIBUTES["Controller Attributes"]
        Route["[Route('api/[controller]')]<br/>───────────<br/>Base route: /api/tasks"]
        ApiController["[ApiController]<br/>───────────<br/>Auto model validation<br/>Auto 400 on invalid"]
        Authorize["[Authorize]<br/>───────────<br/>Requires JWT authentication"]
    end

    subgraph CONTROLLER["TasksController : ControllerBase"]
        direction TB
        Field["private readonly ITaskService _taskService"]

        Constructor["Constructor<br/>───────────<br/>TasksController(ITaskService taskService)"]

        subgraph ENDPOINTS["Endpoints"]
            GET_ALL["GET /api/tasks<br/>GetTasks()"]
            GET_ONE["GET /api/tasks/{id}<br/>GetTask()"]
            GET_MY["GET /api/tasks/my<br/>GetMyTasks()"]
            GET_ASSIGNED["GET /api/tasks/assigned<br/>GetAssignedTasks()"]
            POST["POST /api/tasks<br/>CreateTask()"]
            PUT["PUT /api/tasks/{id}<br/>UpdateTask()"]
            DELETE["DELETE /api/tasks/{id}<br/>DeleteTask()"]
        end
    end

    ATTRIBUTES --> CONTROLLER
```

---

## Endpoint Overview

```mermaid
flowchart TB
    subgraph ENDPOINTS["RESTful Endpoints"]
        direction TB

        subgraph READ["Read Operations"]
            E1["GET /api/tasks<br/>───────────<br/>List all tasks (paginated)<br/>Query params: page, pageSize,<br/>status, assignedTo, search"]
            E2["GET /api/tasks/{id}<br/>───────────<br/>Get single task by ID"]
            E3["GET /api/tasks/my<br/>───────────<br/>Tasks created by current user"]
            E4["GET /api/tasks/assigned<br/>───────────<br/>Tasks assigned to current user"]
        end

        subgraph WRITE["Write Operations"]
            E5["POST /api/tasks<br/>───────────<br/>Create new task<br/>Body: CreateTaskRequestDto"]
            E6["PUT /api/tasks/{id}<br/>───────────<br/>Update existing task<br/>Body: UpdateTaskRequestDto"]
            E7["DELETE /api/tasks/{id}<br/>───────────<br/>Delete task"]
        end
    end
```

---

## GET /api/tasks - List Tasks

```mermaid
sequenceDiagram
    participant C as Client
    participant TC as TasksController
    participant TS as TaskService

    C->>TC: GET /api/tasks?page=1&pageSize=10&status=ToDo

    Note over TC: Extract query parameters

    TC->>TS: GetTasksAsync(1, 10, TaskStatus.ToDo, null, null, null)

    TS-->>TC: TaskListResponseDto {<br/>  Items: [...],<br/>  TotalCount: 25,<br/>  Page: 1,<br/>  PageSize: 10<br/>}

    TC-->>C: 200 OK + JSON body
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `pageSize` | int | 10 | Items per page |
| `status` | TaskStatus? | null | Filter by status |
| `assignedTo` | int? | null | Filter by assignee |
| `createdBy` | int? | null | Filter by creator |
| `search` | string? | null | Search in title/description |

---

## GET /api/tasks/{id} - Get Single Task

```mermaid
sequenceDiagram
    participant C as Client
    participant TC as TasksController
    participant TS as TaskService

    C->>TC: GET /api/tasks/5

    TC->>TS: GetTaskByIdAsync(5)

    alt Task exists
        TS-->>TC: TaskResponseDto
        TC-->>C: 200 OK + JSON body
    else Task not found
        TS-->>TC: null
        TC-->>C: 404 Not Found
    end
```

---

## GET /api/tasks/my - My Created Tasks

```mermaid
sequenceDiagram
    participant C as Client
    participant MW as JWT Middleware
    participant TC as TasksController
    participant TS as TaskService

    C->>MW: GET /api/tasks/my + JWT Token

    MW->>MW: Validate & extract claims

    MW->>TC: Request with ClaimsPrincipal

    TC->>TC: var userId = GetUserIdFromClaims()

    Note over TC: User.FindFirst(ClaimTypes.NameIdentifier)

    TC->>TS: GetMyTasksAsync(userId, page, pageSize)

    TS-->>TC: TaskListResponseDto

    TC-->>C: 200 OK + JSON body
```

---

## POST /api/tasks - Create Task

```mermaid
sequenceDiagram
    participant C as Client
    participant TC as TasksController
    participant TS as TaskService

    C->>TC: POST /api/tasks<br/>Body: { title, description, status, assignedToId }

    Note over TC: [ApiController] validates automatically

    alt Validation fails
        TC-->>C: 400 Bad Request (ValidationProblemDetails)
    end

    TC->>TC: Extract userId from JWT claims

    TC->>TS: CreateTaskAsync(request, userId)

    TS-->>TC: TaskResponseDto

    TC-->>C: 201 Created<br/>Location: /api/tasks/{newId}<br/>Body: TaskResponseDto
```

**Response:**
- Status: `201 Created`
- Header: `Location: /api/tasks/{id}`
- Body: `TaskResponseDto`

---

## PUT /api/tasks/{id} - Update Task

```mermaid
sequenceDiagram
    participant C as Client
    participant TC as TasksController
    participant TS as TaskService

    C->>TC: PUT /api/tasks/5<br/>Body: { title, status }

    TC->>TC: Extract userId from JWT claims

    TC->>TS: UpdateTaskAsync(5, request, userId)

    alt Task not found
        TS-->>TC: throw KeyNotFoundException
        TC-->>C: 404 Not Found
    else Not authorized
        TS-->>TC: throw UnauthorizedAccessException
        TC-->>C: 403 Forbidden
    else Success
        TS-->>TC: TaskResponseDto
        TC-->>C: 200 OK + TaskResponseDto
    end
```

---

## DELETE /api/tasks/{id} - Delete Task

```mermaid
sequenceDiagram
    participant C as Client
    participant TC as TasksController
    participant TS as TaskService

    C->>TC: DELETE /api/tasks/5

    TC->>TC: Extract userId from JWT claims

    TC->>TS: DeleteTaskAsync(5, userId)

    alt Task not found
        TS-->>TC: throw KeyNotFoundException
        TC-->>C: 404 Not Found
    else Not authorized
        TS-->>TC: throw UnauthorizedAccessException
        TC-->>C: 403 Forbidden
    else Success
        TS-->>TC: (void)
        TC-->>C: 204 No Content
    end
```

---

## Extracting User ID from JWT Claims

```mermaid
flowchart TB
    subgraph JWT["JWT Token Payload"]
        Claims["Claims:<br/>───────────<br/>sub: '3' (userId)<br/>email: 'john@example.com'<br/>role: 'User'<br/>exp: 1702500000"]
    end

    subgraph MIDDLEWARE["JWT Middleware"]
        Validate["Validate token signature<br/>Check expiration<br/>Set User.Claims"]
    end

    subgraph CONTROLLER["TasksController"]
        Extract["var userIdClaim = User.FindFirst(<br/>  ClaimTypes.NameIdentifier);<br/><br/>int.TryParse(userIdClaim.Value,<br/>  out var userId);"]
    end

    JWT --> MIDDLEWARE --> CONTROLLER
```

**Code Pattern:**
```csharp
private int GetUserIdFromClaims()
{
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
    if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
    {
        throw new UnauthorizedAccessException();
    }
    return userId;
}
```

---

## HTTP Status Codes Summary

```mermaid
flowchart TB
    subgraph SUCCESS["Success Codes"]
        S200["200 OK<br/>───────────<br/>GET single task<br/>GET list tasks<br/>PUT update task"]
        S201["201 Created<br/>───────────<br/>POST create task"]
        S204["204 No Content<br/>───────────<br/>DELETE task"]
    end

    subgraph CLIENT_ERROR["Client Error Codes"]
        E400["400 Bad Request<br/>───────────<br/>Validation errors<br/>(auto by [ApiController])"]
        E401["401 Unauthorized<br/>───────────<br/>Missing/invalid JWT<br/>(auto by [Authorize])"]
        E403["403 Forbidden<br/>───────────<br/>Not task creator<br/>and not admin"]
        E404["404 Not Found<br/>───────────<br/>Task doesn't exist"]
    end
```

---

## [ApiController] Attribute Benefits

```mermaid
flowchart TB
    subgraph WITHOUT["Without [ApiController]"]
        Manual["Manual validation:<br/>───────────<br/>if (!ModelState.IsValid)<br/>{<br/>  return BadRequest(ModelState);<br/>}"]
    end

    subgraph WITH["With [ApiController]"]
        Auto["Automatic features:<br/>───────────<br/>✅ Auto 400 on invalid model<br/>✅ Auto model binding from body<br/>✅ Auto binding source inference<br/>✅ Problem details for errors"]
    end

    WITHOUT -->|"Add [ApiController]"| WITH
```

---

## [Authorize] Attribute Flow

```mermaid
flowchart TB
    subgraph REQUEST["Incoming Request"]
        Req["GET /api/tasks<br/>Header: Authorization: Bearer <token>"]
    end

    subgraph AUTH_FILTER["[Authorize] Filter"]
        Check1{{"Has Authorization header?"}}
        Check2{{"Valid JWT token?"}}
        Check3{{"Token not expired?"}}
    end

    subgraph RESULT["Result"]
        Success["✅ Proceed to Controller"]
        Fail["❌ 401 Unauthorized"]
    end

    REQUEST --> Check1
    Check1 -->|No| Fail
    Check1 -->|Yes| Check2
    Check2 -->|No| Fail
    Check2 -->|Yes| Check3
    Check3 -->|No| Fail
    Check3 -->|Yes| Success
```

---

## CreatedAtAction Pattern

```mermaid
flowchart LR
    subgraph CODE["CreateTask Method"]
        Return["return CreatedAtAction(<br/>  nameof(GetTask),<br/>  new { id = result.Id },<br/>  result<br/>);"]
    end

    subgraph RESPONSE["HTTP Response"]
        Status["Status: 201 Created"]
        Header["Location: /api/tasks/8"]
        Body["Body: TaskResponseDto JSON"]
    end

    CODE --> RESPONSE
```

**Purpose:** REST convention - POST returns `201 Created` with `Location` header pointing to the new resource.

---

## Exception Handling Pattern

```mermaid
flowchart TB
    subgraph CONTROLLER["TasksController.UpdateTask()"]
        direction TB
        Try["try {<br/>  var result = await _taskService.UpdateTaskAsync(...);<br/>  return Ok(result);<br/>}"]

        Catch1["catch (KeyNotFoundException) {<br/>  return NotFound();<br/>}"]

        Catch2["catch (UnauthorizedAccessException) {<br/>  return Forbid();<br/>}"]
    end

    subgraph RESPONSES["HTTP Responses"]
        R200["200 OK + TaskResponseDto"]
        R404["404 Not Found"]
        R403["403 Forbidden"]
    end

    Try -->|success| R200
    Try -->|not found| Catch1 --> R404
    Try -->|not authorized| Catch2 --> R403
```

---

## Thin Controller Pattern

```mermaid
flowchart LR
    subgraph THIN["✅ Thin Controller (Our Approach)"]
        TC1["TasksController<br/>───────────<br/>• Extract user ID from claims<br/>• Call service method<br/>• Handle exceptions<br/>• Return HTTP response"]
    end

    subgraph SERVICE["TaskService"]
        TS1["TaskService<br/>───────────<br/>• Authorization check<br/>• Business validation<br/>• DTO ↔ Entity mapping<br/>• Database operations"]
    end

    TC1 -->|"delegates all logic"| TS1
```

**Key Points:**
- Controller: ~10-15 lines per method
- No business logic in controller
- No direct repository access
- Only HTTP concerns (status codes, headers)
