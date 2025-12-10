# Toast Notifications - API Contract

[Back to API Documentation](../API-Contract-Documentation.md)

---

## Wireframe

![Toast Notifications](../../wireframes/Toasts.png)

---

## User Actions

- View real-time notifications when events occur
- Click close (X) button to dismiss notification
- Notifications persist until manually closed

---

## Frontend Needs

| Component | Description |
|-----------|-------------|
| Toast Container | Fixed position, top-right corner |
| Success Toast | Green (#00875a), checkmark icon |
| Info Toast | Blue (#0052cc), info icon |
| Warning Toast | Yellow (#ff991f), warning icon |
| Error Toast | Red (#de350b), error icon |
| Close Button | X button on each toast |
| Stacking | Multiple toasts stack vertically |

---

## Backend Processing

**Notification Rules (from PDF Section 4):**

| Event | Recipients | Trigger |
|-------|------------|---------|
| Task created | All connected users | SignalR broadcast when any user creates a task |
| Task assigned | Assigned user only | SignalR targeted notification to the assigned user |
| Status updated (by assignee) | Task creator only | SignalR targeted notification when assignee changes status |
| Task deleted | All connected users | SignalR broadcast when any task is deleted |

---

## Project Requirements

> **From Final Project PDF - Section 10: Toast Notifications & Real-Time Feedback (1.5 marks)**
>
> - Implement **toast notification system**
> - Show notifications for all real-time events
> - Notifications must **persist until user closes them**
> - Include **close button (X)** on each notification
> - Display **notification type** (success, info, warning, error)
> - Show **proper messages with task details**
>
> **Notification Triggers:**
> | Event | Message | Type |
> |-------|---------|------|
> | Task created | "Task '{title}' created successfully" | Success (Green) |
> | Task assigned to you | "You have been assigned to: {title}" | Info (Blue) |
> | Task status updated | "Task '{title}' status updated to: {status}" | Info (Blue) |
> | Task deleted | "Task deleted: {title}" | Warning (Red) |
> | Error occurred | Show error message | Error (Red) |
>
> **Notification Design:**
> - Color-coded by type:
>   - Success: Green (#00875a)
>   - Info: Blue (#0052cc)
>   - Warning: Yellow (#ff991f)
>   - Error: Red (#de350b)
> - Position: Top-right corner (fixed)
> - Animation: Slide-in from right
> - Close button: X in top-right of notification
> - Auto-stack: Multiple notifications stack vertically
> - **Persistence: Display until manually closed (no auto-dismiss)**
>
> **Implementation Notes:**
> - Do NOT auto-dismiss after 3 seconds
> - User must click X to close
> - Page can refresh 5 seconds after notification appears
> - Notification stays visible until closed

---

## SignalR Events to Toast Mapping

### Event: TaskCreated

**SignalR Payload:**
```json
{
  "task": {
    "id": 112,
    "title": "Implement dark mode theme",
    "status": "ToDo"
  },
  "message": "Task created: Implement dark mode theme"
}
```

**Toast Display:**
- Type: Success (Green)
- Icon: Checkmark
- Message: "Task 'Implement dark mode theme' created successfully"

---

### Event: TaskAssigned

**SignalR Payload (sent only to assigned user):**
```json
{
  "task": {
    "id": 112,
    "title": "Implement dark mode theme",
    "assignedTo": {
      "id": 3,
      "name": "Mike Johnson"
    }
  },
  "message": "You have been assigned to: Implement dark mode theme"
}
```

**Toast Display:**
- Type: Info (Blue)
- Icon: Info circle
- Message: "You have been assigned to: 'Implement dark mode theme'"

---

### Event: TaskUpdated (Status Change by Assignee)

> **Important:** This event is sent **only to the task creator** when the **assignee** updates the task status.

**SignalR Payload (sent only to task creator):**
```json
{
  "task": {
    "id": 101,
    "title": "Implement user authentication flow",
    "status": "Done",
    "previousStatus": "Review"
  },
  "message": "Task 'Implement user authentication flow' status updated to: Done"
}
```

**Toast Display:**
- Type: Info (Blue)
- Icon: Checkmark
- Message: "Task 'Implement user authentication flow' status updated to: Done"

---

### Event: TaskDeleted

**SignalR Payload:**
```json
{
  "taskId": 105,
  "title": "Old feature request",
  "message": "Task deleted: Old feature request"
}
```

**Toast Display:**
- Type: Warning (Yellow)
- Icon: Trash
- Message: "Task deleted: 'Old feature request'"

---

### API Error Response

**When any API returns an error:**

**Toast Display:**
- Type: Error (Red)
- Icon: X circle
- Message: `error.message` or "Something went wrong. Please try again."

---

## Toast Component Specifications

### Toast Types

| Type | Background | Border | Icon | Text Color |
|------|------------|--------|------|------------|
| Success | #e3fcef | #00875a | Checkmark | #00875a |
| Info | #deebff | #0052cc | Info | #0052cc |
| Warning | #fff0b3 | #ff991f | Warning | #ff991f |
| Error | #ffebe6 | #de350b | X Circle | #de350b |

### Animation

```css
/* Slide in from right */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Slide out to right */
@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
```

### Layout

```
+----------------------------------+
| [Icon] Message text here...   [X] |
+----------------------------------+
```

### Container Positioning

```css
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```
