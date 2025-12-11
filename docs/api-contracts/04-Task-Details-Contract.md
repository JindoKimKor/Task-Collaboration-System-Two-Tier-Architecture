# Task Details Page - API Contract

[Back to API Documentation](../API-Contract-Documentation.md)

---

## Wireframes

![Task Details - View](../../wireframes/Task-Details-Page(1).png)

![Task Details - Status Dropdown](../../wireframes/Task-Details-Page(2).png)

---

## User Actions

- View task details (Title, Description)
- Change task status via dropdown
- Change assignee
- Edit task (if authorized)
- Delete task (if authorized)
- Navigate back via breadcrumb

---

## Frontend Needs

| Component | Description |
|-----------|-------------|
| Breadcrumb | "Board > {taskId}" navigation |
| Two-column layout | Main content (70%) + Sidebar (30%) |
| Task Title | Large, prominent display |
| Description | Markdown-supported text area |
| Status Dropdown | 5 status options with colors |
| Assignee Section | Avatar, name, "Change" button |
| Reporter Section | Avatar and name |
| Dates Section | Created and Updated timestamps |
| Cache Status | "Cached" or "Live" badge |
| Edit/Delete buttons | Top-right action icons |
| Archived Banner | Yellow warning if task is archived |

---

## Backend Processing

| Validation | Description |
|------------|-------------|
| JWT Token | Validate and extract user |
| Task Existence | Return 404 if not found |
| Authorization | Check edit/delete permissions |
| Cache Check | Return X-Cache header (HIT/MISS) |

---

## Project Requirements

> **From Final Project PDF - Section 7: User Interface (4 marks)**
>
> **Task Details Page (1 mark):**
> - **Two-column layout** (main content + sidebar)
> - Main content: Task title, description
> - Sidebar: Status, assignee, reporter, dates
> - **Breadcrumb navigation**
> - Edit button (if authorized)
> - **Cache indicator badge** (if loaded from cache)
> - **Archived warning banner** (if archived)
>
> **From Section 6: Caching Strategy (2 marks)**
>
> - Cache key format: `task_{id}`
> - TTL: 5 minutes (configurable)
> - Invalidate on: PUT/DELETE operations
> - Cache header: Add `X-Cache: HIT` or `X-Cache: MISS` to responses
> - Simulate delay: 2-second database delay to demonstrate caching benefit

---

## API Contracts

### API 4.1: Get Single Task

```http
GET /api/tasks/{id}
Authorization: Bearer {token}
```

**Response Headers:**
```
X-Cache: HIT (or MISS)
```

**Response - Success (200):**
```json
{
  "id": 101,
  "title": "Implement user authentication flow",
  "description": "We need to implement a comprehensive user authentication system that includes login, registration, password reset, and social authentication (Google). The system should be secure and follow industry best practices.",
  "status": "Development",
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
  "createdAt": "2025-12-07T10:00:00Z",
  "updatedAt": "2025-12-08T14:30:00Z",
  "isArchived": false,
  "archivedAt": null
}
```

**Response - Error (404):**
```json
{
  "error": "Not found",
  "message": "Task not found"
}
```

---

### API 4.2: Update Task

```http
PUT /api/tasks/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Implement user authentication flow",
  "description": "Updated description with more details...",
  "status": "Review",
  "assignedToId": 2
}
```

**Response - Success (200):**
```json
{
  "id": 101,
  "title": "Implement user authentication flow",
  "description": "Updated description with more details...",
  "status": "Review",
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
  "createdAt": "2025-12-07T10:00:00Z",
  "updatedAt": "2025-12-08T15:00:00Z",
  "isArchived": false
}
```

**Response - Error (403):**
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to edit this task"
}
```

**Response - Error (400):**
```json
{
  "error": "Validation failed",
  "errors": {
    "title": "Title is required",
    "status": "Invalid status value"
  }
}
```

---

### API 4.3: Delete Task

```http
DELETE /api/tasks/{id}
Authorization: Bearer {token}
```

**Response - Success (204):** No Content

**Response - Error (403):**
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to delete this task"
}
```

**Response - Error (404):**
```json
{
  "error": "Not found",
  "message": "Task not found"
}
```

---

### API 4.4: Get All Users (for Assignee Dropdown)

```http
GET /api/users
Authorization: Bearer {token}
```

**Response - Success (200):**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "initials": "JD"
  },
  {
    "id": 2,
    "name": "Sarah Chen",
    "initials": "SC"
  },
  {
    "id": 3,
    "name": "Mike Johnson",
    "initials": "MJ"
  },
  {
    "id": 4,
    "name": "Emma Wilson",
    "initials": "EW"
  },
  {
    "id": 5,
    "name": "Alex Turner",
    "initials": "AT"
  }
]
```

---

### API 4.5: Get User by ID

```http
GET /api/users/{id}
Authorization: Bearer {token}
```

**Response - Success (200):**
```json
{
  "id": 2,
  "name": "Sarah Chen",
  "email": "sarah.chen@example.com",
  "username": "sarahchen",
  "role": "User",
  "initials": "SC",
  "createdAt": "2025-11-15T08:00:00Z"
}
```

**Response - Error (404):**
```json
{
  "error": "Not found",
  "message": "User not found"
}
```
