# Tasks Feature

## Overview

| Item | Value |
|------|-------|
| Folder | `src/features/tasks/` |
| Redux Slice | `tasksSlice.ts` |
| Related Pages | TaskBoardPage, TaskDetailsPage, CreateTaskPage, EditTaskPage, AdminTasksPage |
| Backend Domain | Task |

---

## Folder Structure

```
features/tasks/
├── components/
│   ├── KanbanBoard.tsx
│   ├── TaskColumn.tsx
│   ├── TaskCard.tsx
│   ├── TaskDetailsView.tsx
│   ├── TaskForm.tsx
│   ├── TaskFilters.tsx
│   └── AdminTaskTable.tsx
├── hooks/
│   ├── useTasks.ts
│   ├── useTaskDetails.ts
│   └── useTaskPermissions.ts
├── services/
│   └── taskService.ts
├── types.ts
└── tasksSlice.ts
```

---

## State Structure (tasksSlice)

| Property | Type | Description |
|----------|------|-------------|
| `tasks` | `Task[]` | List of tasks |
| `selectedTask` | `Task \| null` | Currently viewed task |
| `pagination` | `PaginationState` | Pagination info |
| `filters` | `FilterState` | Active filters |
| `cacheStatus` | `'HIT' \| 'MISS' \| null` | Last cache status from X-Cache header |
| `loading` | `boolean` | API call in progress |
| `error` | `string \| null` | Error message |

### Task Type

| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Task ID |
| `title` | `string` | Task title |
| `description` | `string \| null` | Task description |
| `status` | `TaskStatus` | Current status |
| `createdById` | `number` | Creator's user ID |
| `createdBy` | `User` | Creator user object |
| `assignedToId` | `number \| null` | Assignee's user ID |
| `assignedTo` | `User \| null` | Assignee user object |
| `createdAt` | `string` | Creation timestamp |
| `updatedAt` | `string` | Last update timestamp |
| `isArchived` | `boolean` | Archive flag |
| `archivedAt` | `string \| null` | Archive timestamp |

### TaskStatus Enum

| Value | Display | Background | Text Color |
|-------|---------|------------|------------|
| `ToDo` | To-Do | `#dfe1e6` | `#5e6c84` |
| `Development` | Development | `#deebff` | `#0052cc` |
| `Review` | Review | `#fff0b3` | `#ff991f` |
| `Merge` | Merge | `#eae6ff` | `#6554c0` |
| `Done` | Done | `#e3fcef` | `#00875a` |

### PaginationState

| Property | Type | Description |
|----------|------|-------------|
| `currentPage` | `number` | Current page (1-indexed) |
| `pageSize` | `number` | Items per page |
| `totalCount` | `number` | Total matching tasks |
| `totalPages` | `number` | Total pages |

### FilterState

| Property | Type | Description |
|----------|------|-------------|
| `status` | `TaskStatus \| null` | Filter by status |
| `assignedTo` | `number \| null` | Filter by assignee |
| `createdBy` | `number \| null` | Filter by creator |
| `search` | `string` | Search in title/description |
| `includeArchived` | `boolean` | Include archived (Admin only) |

---

## Actions & Thunks

| Action | Type | API Endpoint | Description |
|--------|------|--------------|-------------|
| `fetchTasks` | Async Thunk | `GET /api/tasks` | Get tasks with pagination/filters |
| `fetchTaskById` | Async Thunk | `GET /api/tasks/:id` | Get single task (with cache status) |
| `createTask` | Async Thunk | `POST /api/tasks` | Create new task |
| `updateTask` | Async Thunk | `PUT /api/tasks/:id` | Update task |
| `deleteTask` | Async Thunk | `DELETE /api/tasks/:id` | Delete task |
| `fetchMyTasks` | Async Thunk | `GET /api/tasks/my` | Get current user's created tasks |
| `fetchAssignedTasks` | Async Thunk | `GET /api/tasks/assigned` | Get tasks assigned to current user |
| `setFilters` | Reducer | - | Update filter state |
| `setPage` | Reducer | - | Change current page |
| `taskCreated` | Reducer | - | Add task (from SignalR) |
| `taskUpdated` | Reducer | - | Update task (from SignalR) |
| `taskDeleted` | Reducer | - | Remove task (from SignalR) |

---

## Services (taskService.ts)

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getTasks` | `queryParams` | `PagedResponse<Task>` | Get paginated tasks |
| `getTaskById` | `id` | `{ task, cacheStatus }` | Get task with cache header |
| `createTask` | `CreateTaskDto` | `Task` | Create new task |
| `updateTask` | `id, UpdateTaskDto` | `Task` | Update existing task |
| `deleteTask` | `id` | `void` | Delete task |
| `getMyTasks` | `page, pageSize` | `PagedResponse<Task>` | Get user's created tasks |
| `getAssignedTasks` | `page, pageSize` | `PagedResponse<Task>` | Get assigned tasks |

---

## Components

### KanbanBoard

5-column Kanban board layout.

| Feature | Description |
|---------|-------------|
| Columns | ToDo, Development, Review, Merge, Done |
| Column Header | Status name + task count badge |
| Task Cards | Rendered in respective status columns |
| Real-time | Updates automatically via SignalR |
| Responsive | Grid adjusts to screen size |

### TaskColumn

| Prop | Type | Description |
|------|------|-------------|
| `status` | `TaskStatus` | Column status |
| `tasks` | `Task[]` | Tasks in this column |
| `color` | `{ bg, text }` | Status colors |

### TaskCard

| Feature | Description |
|---------|-------------|
| Title | Task title (clickable → TaskDetailsPage) |
| Assignee Avatar | User avatar with initials/image |
| Status Badge | Color-coded status indicator |
| Click Action | Navigate to `/tasks/:id` |

### TaskDetailsView

| Section | Content |
|---------|---------|
| Breadcrumb | "Board > {Task Title}" navigation |
| Main (Left) | Title, description, activity timeline |
| Sidebar (Right) | Status, Assignee, Reporter, Created/Updated dates |
| Actions | Edit button, Delete button (if authorized) |
| Cache Badge | "Cached" or "Live" indicator |
| Archived Banner | Yellow warning if viewing archived task |

### TaskForm

| Field | Type | Validation |
|-------|------|------------|
| Title | Text input | Required, max 200 chars |
| Description | Textarea | Optional, max 2000 chars |
| Status | Dropdown | Required, 5 options |
| Assign To | Dropdown | Optional, user list |

### AdminTaskTable

| Feature | Description |
|---------|-------------|
| View | Table/list format |
| Filters | Status, Assignee, Search |
| Include Archived | Toggle checkbox (Admin only) |
| Sorting | By created date, updated date, status |
| Archived Indicator | Faded row + "Archived" badge |

---

## Hooks

### useTasks

```typescript
const { tasks, loading, error, filters, pagination, setFilters, setPage, refresh } = useTasks();
```

### useTaskDetails

```typescript
const { task, cacheStatus, loading, error, refresh } = useTaskDetails(taskId);
```

### useTaskPermissions

```typescript
const { canEdit, canDelete, canEditAllFields, canEditStatusOnly } = useTaskPermissions(task);
```

| Return Value | Description |
|--------------|-------------|
| `canEdit` | User can edit this task (creator, assignee, or admin) |
| `canDelete` | User can delete this task (creator or admin) |
| `canEditAllFields` | User can edit all fields (creator or admin) |
| `canEditStatusOnly` | User can only edit status (assignee only) |

---

## Pages

### TaskBoardPage

| Feature | Description |
|---------|-------------|
| Path | `/board` |
| Auth Required | Yes |
| Components | KanbanBoard, TaskFilters |
| Default View | All non-archived tasks grouped by status |

### TaskDetailsPage

| Feature | Description |
|---------|-------------|
| Path | `/tasks/:id` |
| Auth Required | Yes |
| Components | TaskDetailsView |
| UI Elements | Breadcrumb, Cache badge, Archived banner |

### CreateTaskPage

| Feature | Description |
|---------|-------------|
| Path | `/tasks/new` |
| Auth Required | Yes |
| Components | TaskForm |
| On Success | Redirect to `/board`, SignalR broadcasts creation |

### EditTaskPage

| Feature | Description |
|---------|-------------|
| Path | `/tasks/:id/edit` |
| Auth Required | Yes (Creator/Assignee/Admin) |
| Components | TaskForm |
| Field Access | Based on permission (all fields or status only) |

### AdminTasksPage

| Feature | Description |
|---------|-------------|
| Path | `/admin/tasks` |
| Auth Required | Yes (Admin only) |
| Components | AdminTaskTable, TaskFilters |
| Special | Can view archived tasks with toggle |

---

## Authorization Rules

### Edit Permissions

| User Type | Can Edit | Editable Fields |
|-----------|----------|-----------------|
| Task Creator | Yes | All fields (title, description, status, assignee) |
| Task Assignee | Yes | Status only |
| Admin | Yes | All fields on any task |
| Others | No | - |

### Delete Permissions

| User Type | Can Delete |
|-----------|------------|
| Task Creator | Yes |
| Admin | Yes |
| Others | No |

### Visibility

| User Type | Can See Archived |
|-----------|-----------------|
| Regular User | No |
| Admin | Yes (with filter) |

---

## SignalR Event Handling

| Event | Action | Toast |
|-------|--------|-------|
| `TaskCreated` | Add to task list | Success: "Task created: {title}" |
| `TaskAssigned` | Update task in list | Info: "You have been assigned to: {title}" |
| `TaskUpdated` | Update task in list | Info: "Task '{title}' status updated to: {status}" |
| `TaskDeleted` | Remove from task list | Warning: "Task deleted: {title}" |

---

## Cache Handling

| Header Value | UI Display | Meaning |
|--------------|------------|---------|
| `X-Cache: HIT` | "Cached" badge (green) | Data served from cache |
| `X-Cache: MISS` | "Live" badge (blue) | Data fetched from database |

---

## Related Documentation

- [Frontend Architecture](../Frontend-Architecture.md)
- [Task Board API Contract](../../api-contracts/03-Task-Board-Contract.md)
- [Task Details API Contract](../../api-contracts/04-Task-Details-Contract.md)
- [Create/Edit Task API Contract](../../api-contracts/05-Create-Edit-Task-Contract.md)
- [Admin All Tasks API Contract](../../api-contracts/06-Admin-All-Tasks-Contract.md)
