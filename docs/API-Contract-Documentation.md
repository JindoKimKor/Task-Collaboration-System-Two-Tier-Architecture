# API Contract Documentation

## Task Collaboration System - Two-Tier Architecture

This document provides an overview of the API contracts for the Task Collaboration System. For detailed contracts per page, see the individual files in the [api-contracts](./api-contracts/) folder.

---

## Table of Contents

| # | Page | Contract File |
|---|------|---------------|
| 1 | Login Page | [01-Login-Page-Contract.md](./api-contracts/01-Login-Page-Contract.md) |
| 2 | Registration Page | [02-Registration-Page-Contract.md](./api-contracts/02-Registration-Page-Contract.md) |
| 3 | Task Board (Kanban) | [03-Task-Board-Contract.md](./api-contracts/03-Task-Board-Contract.md) |
| 4 | Task Details | [04-Task-Details-Contract.md](./api-contracts/04-Task-Details-Contract.md) |
| 5 | Create/Edit Task Modal | [05-Create-Edit-Task-Contract.md](./api-contracts/05-Create-Edit-Task-Contract.md) |
| 6 | Admin - All Tasks View | [06-Admin-All-Tasks-Contract.md](./api-contracts/06-Admin-All-Tasks-Contract.md) |
| 7 | Toast Notifications | [07-Toast-Notifications-Contract.md](./api-contracts/07-Toast-Notifications-Contract.md) |

---

## API Summary

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/login` | Login with username/password | No |
| POST | `/api/auth/google` | Google OAuth callback | No |
| POST | `/api/auth/refresh` | Refresh JWT token | No |
| GET | `/api/auth/me` | Get current user info | Yes |

### Task Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tasks` | Get all tasks (with pagination) | Yes |
| GET | `/api/tasks/{id}` | Get single task | Yes |
| POST | `/api/tasks` | Create new task | Yes |
| PUT | `/api/tasks/{id}` | Update task | Yes |
| DELETE | `/api/tasks/{id}` | Delete task | Yes |
| GET | `/api/tasks/my` | Get current user's tasks | Yes |
| GET | `/api/tasks/assigned` | Get tasks assigned to current user | Yes |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users` | Get all users (for assignment) | Yes |
| GET | `/api/users/{id}` | Get user details | Yes |

### SignalR Hub

| Hub URL | Events |
|---------|--------|
| `/hubs/tasks` | TaskCreated, TaskUpdated, TaskDeleted, TaskAssigned |

---

## HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Invalid/expired token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## Authorization Rules

### Regular Users
- Can create tasks
- Can edit/delete only their **own created** tasks
- Can edit tasks **assigned to them** (status only)
- Can view tasks assigned to them
- Cannot see "All Tasks" page

### Admin Users
- Can edit/delete **any** task
- Can see "All Tasks" page with filters
- Can assign tasks to anyone
- Can change any task status
- Can view archived tasks

---

## Task Status Values

| Status | Background Color | Text Color |
|--------|-----------------|------------|
| ToDo | #dfe1e6 | #5e6c84 |
| Development | #deebff | #0052cc |
| Review | #fff0b3 | #ff991f |
| Merge | #eae6ff | #6554c0 |
| Done | #e3fcef | #00875a |

---

## Configuration Requirements

From the Final Project PDF:
- **JWT Secret Key**: Stored in appsettings.json
- **Token Expiry**: 7 days
- **Admin User Email**: Configurable
- **Cache TTL**: 5 minutes
- **Auto-Archive Interval**: 2 seconds (Background Service)

---

## Background Service - Auto Archive Logic

From PDF Section 5 (2 marks):

**Service runs every 2 seconds and archives tasks matching ALL conditions:**
1. Status = "Done"
2. UpdatedAt > 5 seconds ago (task has been Done for at least 5 seconds)
3. IsArchived = false

**Archive Action:**
- Set `IsArchived = true`
- Set `ArchivedAt = DateTime.UtcNow`
- Do NOT delete tasks from database

**Visibility Rules:**
- Admin users: Can see archived tasks (with `includeArchived=true` filter)
- Regular users: Cannot see archived tasks

---

## SignalR Notification Rules

From PDF Section 4 (3 marks):

| Event | Recipients | Message |
|-------|------------|---------|
| Task created | All connected users | "Task created: {title}" |
| Task assigned | Assigned user only | "You have been assigned to: {title}" |
| Status updated (by assignee) | Task creator only | "Task '{title}' status updated to: {status}" |
| Task deleted | All connected users | "Task deleted: {title}"

---

*Document generated for Task Collaboration System - Two-Tier Architecture*
