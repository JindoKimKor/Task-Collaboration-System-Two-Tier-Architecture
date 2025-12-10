# Create/Edit Task Modal - API Contract

[Back to API Documentation](../API-Contract-Documentation.md)

---

## Wireframes

![Create Task - Basic](../../wireframes/Create-page.png)

![Create Task - Status Dropdown](../../wireframes/Create-page(1).png)

![Create Task - Assignee Dropdown](../../wireframes/Create-page(2).png)

---

## User Actions

- Enter task Title (required)
- Enter task Description (optional)
- Select Status from dropdown
- Select Assignee from dropdown (or leave Unassigned)
- Click "Create Task" or "Save Changes"
- Click "Cancel" to close modal

---

## Frontend Needs

| Component | Description |
|-----------|-------------|
| Modal overlay | Dark background overlay |
| Modal header | "Create Task" or "Edit Task" with close (X) button |
| Title input | Required field with validation |
| Description textarea | Optional, multi-line input |
| Status dropdown | 5 options: To-Do, Development, Review, Merge, Done |
| Assign to dropdown | List of all users + "Unassigned" option |
| Cancel button | Secondary action, closes modal |
| Submit button | "Create Task" or "Save Changes" |
| Validation errors | Inline error messages |

---

## Backend Processing

| Validation | Description |
|------------|-------------|
| Title | Required, 1-200 characters |
| Description | Optional, max 2000 characters |
| Status | Required, must be valid enum value |
| AssignedToId | Optional, must be valid user ID if provided |
| CreatedById | Set from JWT token claims |

---

## Project Requirements

> **From Final Project PDF - Section 7: User Interface (4 marks)**
>
> **Create/Edit Task Form (0.5 marks):**
> - Title (required, text input)
> - Description (optional, textarea)
> - Status (dropdown with 5 options)
> - Assign to (dropdown with all users)
> - Validation messages
> - Submit/Cancel buttons
>
> **From Section 3: RESTful API Development (3 marks)**
>
> | Method | Endpoint | Description | Auth Required |
> |--------|----------|-------------|---------------|
> | POST | /api/tasks | Create new task | Yes |
> | PUT | /api/tasks/{id} | Update task | Yes |
> | DELETE | /api/tasks/{id} | Delete task | Yes |
>
> **From Section 2: Data Layer - Tasks Table Schema**
>
> | Column | Type | Constraints |
> |--------|------|-------------|
> | Id | int | Primary Key |
> | Title | string | Required |
> | Description | string | Nullable |
> | Status | enum | Required (ToDo, Development, Review, Merge, Done) |
> | CreatedById | int | Foreign Key -> Users |
> | AssignedToId | int | Foreign Key -> Users, Nullable |
> | CreatedAt | DateTime | Required |
> | UpdatedAt | DateTime | Required |
> | IsArchived | bool | Required |
> | ArchivedAt | DateTime | Nullable |

---

## API Contracts

### API 5.1: Create Task

```http
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Implement dark mode theme",
  "description": "Add dark mode support to the application with toggle in settings.",
  "status": "ToDo",
  "assignedToId": 3
}
```

**Response - Success (201):**
```json
{
  "id": 112,
  "title": "Implement dark mode theme",
  "description": "Add dark mode support to the application with toggle in settings.",
  "status": "ToDo",
  "createdBy": {
    "id": 1,
    "name": "John Doe",
    "initials": "JD"
  },
  "assignedTo": {
    "id": 3,
    "name": "Mike Johnson",
    "initials": "MJ"
  },
  "createdAt": "2025-12-08T16:00:00Z",
  "updatedAt": "2025-12-08T16:00:00Z",
  "isArchived": false
}
```

**Response - Error (400):**
```json
{
  "error": "Validation failed",
  "errors": {
    "title": "Title is required"
  }
}
```

---

### API 5.2: Update Task

*(Same as API 4.2)*

```http
PUT /api/tasks/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Implement dark mode theme",
  "description": "Updated description...",
  "status": "Development",
  "assignedToId": 3
}
```

**Response - Success (200):**
```json
{
  "id": 112,
  "title": "Implement dark mode theme",
  "description": "Updated description...",
  "status": "Development",
  "createdBy": {
    "id": 1,
    "name": "John Doe",
    "initials": "JD"
  },
  "assignedTo": {
    "id": 3,
    "name": "Mike Johnson",
    "initials": "MJ"
  },
  "createdAt": "2025-12-08T16:00:00Z",
  "updatedAt": "2025-12-08T17:00:00Z",
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

---

### API 5.3: Delete Task

*(Same as API 4.3)*

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
