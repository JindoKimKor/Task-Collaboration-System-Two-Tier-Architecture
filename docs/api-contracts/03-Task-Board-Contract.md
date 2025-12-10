# Task Board (Kanban) - API Contract

[Back to API Documentation](../API-Contract-Documentation.md)

---

## Wireframe

![Task Board](../../wireframes/Task-Board-page.png)

---

## User Actions

- View all tasks organized by status columns
- Click on a task card to view details
- Click "+ Create Task" to open create modal
- Access user dropdown (Profile, Settings, Logout)
- Receive real-time updates when tasks change

---

## Frontend Needs

| Component | Description |
|-----------|-------------|
| Navigation Header | Logo, Board, My Tasks links, Create button, notifications, user avatar |
| 5 Kanban Columns | To-Do, Development, Review, Merge, Done |
| Column Headers | Status name with task count badge |
| Task Cards | Task ID, Title, Assignee avatar |
| User Dropdown | Profile, Settings, Logout options |
| SignalR Connection | Real-time task updates |

**Column Colors (from PDF):**
| Status | Background | Text Color |
|--------|------------|------------|
| To-Do | #dfe1e6 | #5e6c84 |
| Development | #deebff | #0052cc |
| Review | #fff0b3 | #ff991f |
| Merge | #eae6ff | #6554c0 |
| Done | #e3fcef | #00875a |

---

## Backend Processing

| Validation | Description |
|------------|-------------|
| JWT Token | Validate token, extract user claims |
| User Role | Determine visible tasks based on role |
| Archived Filter | Exclude archived tasks for regular users |
| Pagination | Support page and pageSize parameters |

---

## Project Requirements

> **From Final Project PDF - Section 3: RESTful API Development (3 marks)**
>
> - Design and implement **RESTful API** following REST principles
> - Implement complete **CRUD operations** for tasks
> - Return proper **HTTP status codes** (200, 201, 400, 401, 404, 500)
> - Implement **filtering and pagination** for GET requests
>
> **Required Endpoints:**
> | Method | Endpoint | Description | Auth Required |
> |--------|----------|-------------|---------------|
> | GET | /api/tasks | Get all tasks (with pagination) | Yes |
> | GET | /api/tasks/my | Get current user's tasks | Yes |
> | GET | /api/tasks/assigned | Get tasks assigned to current user | Yes |
>
> **Query Parameters for GET /api/tasks:**
> - page - Page number (default: 1)
> - pageSize - Items per page (default: 20)
> - status - Filter by status
> - assignedTo - Filter by assignee ID
> - createdBy - Filter by creator ID
> - search - Search in title/description
>
> **From Section 7: User Interface (4 marks)**
>
> **Task Board - Kanban Layout (1.5 marks):**
> - 5 columns: To-Do, Development, Review, Merge, Done
> - Color-coded cards based on status
> - Task count per column in header
> - User avatars on cards showing assignee
> - Click to view details
> - Real-time updates when tasks change
> - Responsive grid layout

---

## API Contracts

### API 3.1: Get All Tasks (Board View)

```http
GET /api/tasks?page=1&pageSize=20
Authorization: Bearer {token}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page |
| status | string | - | Filter by status (ToDo, Development, Review, Merge, Done) |
| assignedTo | number | - | Filter by assignee user ID |
| createdBy | number | - | Filter by creator user ID |
| search | string | - | Search in title/description |

**Response - Success (200):**
```json
{
  "data": [
    {
      "id": 101,
      "title": "Implement user authentication flow",
      "description": "We need to implement...",
      "status": "ToDo",
      "createdBy": {
        "id": 1,
        "name": "Mike Johnson",
        "initials": "MJ"
      },
      "assignedTo": {
        "id": 2,
        "name": "Sarah Chen",
        "initials": "SC"
      },
      "createdAt": "2025-12-01T09:00:00Z",
      "updatedAt": "2025-12-07T14:30:00Z",
      "isArchived": false
    },
    {
      "id": 102,
      "title": "Design new dashboard layout",
      "description": "Create wireframes for...",
      "status": "ToDo",
      "createdBy": {
        "id": 2,
        "name": "Sarah Chen",
        "initials": "SC"
      },
      "assignedTo": {
        "id": 3,
        "name": "Mike Johnson",
        "initials": "MJ"
      },
      "createdAt": "2025-12-02T10:00:00Z",
      "updatedAt": "2025-12-06T11:00:00Z",
      "isArchived": false
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 11,
  "totalPages": 1
}
```

**Response - Error (401):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

---

### API 3.2: Get Current User Info

```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response - Success (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "role": "Admin",
  "createdAt": "2025-11-01T08:00:00Z"
}
```

---

### API 3.3: Get My Tasks

```http
GET /api/tasks/my?page=1&pageSize=20
Authorization: Bearer {token}
```

**Response - Success (200):**
```json
{
  "data": [
    {
      "id": 101,
      "title": "Implement user authentication flow",
      "status": "Development",
      "createdBy": {
        "id": 1,
        "name": "John Doe",
        "initials": "JD"
      },
      "assignedTo": {
        "id": 2,
        "name": "Sarah Chen",
        "initials": "SC"
      },
      "createdAt": "2025-12-01T09:00:00Z",
      "updatedAt": "2025-12-07T14:30:00Z",
      "isArchived": false
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 5,
  "totalPages": 1
}
```

---

### API 3.4: Get Assigned Tasks

```http
GET /api/tasks/assigned?page=1&pageSize=20
Authorization: Bearer {token}
```

**Response - Success (200):**
```json
{
  "data": [
    {
      "id": 104,
      "title": "Build API endpoint for user profiles",
      "status": "Development",
      "createdBy": {
        "id": 2,
        "name": "Sarah Chen",
        "initials": "SC"
      },
      "assignedTo": {
        "id": 1,
        "name": "John Doe",
        "initials": "JD"
      },
      "createdAt": "2025-12-03T11:00:00Z",
      "updatedAt": "2025-12-07T09:00:00Z",
      "isArchived": false
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 3,
  "totalPages": 1
}
```

---

### API 3.5: SignalR Hub Connection

> **From Final Project PDF - Section 4: Real-Time Communication - SignalR (3 marks)**
>
> - Implement **SignalR Hub** for real-time notifications
> - Broadcast task creation, updates, and deletions
> - Implement **targeted notifications** (only to specific users)
> - Track online users and connections
> - Handle connection lifecycle properly

```
Hub URL: /hubs/tasks
Connection: wss://localhost:5001/hubs/tasks?access_token={token}
```

**Notification Rules (from PDF):**

| Event | Recipients | Message |
|-------|------------|---------|
| Task created | All connected users | "Task created: {title}" |
| Task assigned | Assigned user only | "You have been assigned to: {title}" |
| Status updated (by assignee) | Task creator only | "Task '{title}' status updated to: {status}" |
| Task deleted | All connected users | "Task deleted: {title}" |

**Client Events (Listen):**

| Event | Description | Payload |
|-------|-------------|---------|
| TaskCreated | Fired to all connected users | `{ task: TaskObject, message: "Task created: {title}" }` |
| TaskUpdated | Fired to task creator only (when assignee updates status) | `{ task: TaskObject, message: "Task '{title}' status updated to: {status}" }` |
| TaskDeleted | Fired to all connected users | `{ taskId: number, message: "Task deleted: {title}" }` |
| TaskAssigned | Fired only to assigned user | `{ task: TaskObject, message: "You have been assigned to: {title}" }` |

**Server Methods (Invoke):**

| Method | Description |
|--------|-------------|
| JoinBoard | Join the task board room for updates |
| LeaveBoard | Leave the task board room |
