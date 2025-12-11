# Toast Feature

## Overview

| Item | Value |
|------|-------|
| Folder | `src/features/toast/` |
| Redux Slice | `toastSlice.ts` |
| Related Pages | Global (rendered in App.tsx) |
| Triggered By | SignalR events, API responses |

---

## Folder Structure

```
features/toast/
├── components/
│   ├── ToastContainer.tsx
│   └── ToastItem.tsx
└── toastSlice.ts
```

---

## State Structure (toastSlice)

| Property | Type | Description |
|----------|------|-------------|
| `toasts` | `Toast[]` | Array of active notifications |

### Toast Type

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier (UUID) |
| `type` | `ToastType` | Notification type |
| `message` | `string` | Display message |
| `createdAt` | `number` | Timestamp for ordering |

### ToastType Enum

| Value | Color | Usage |
|-------|-------|-------|
| `success` | Green (`#00875a`) | Task created, successful operations |
| `info` | Blue (`#0052cc`) | Task assigned, status updated |
| `warning` | Yellow (`#ff991f`) | Task deleted |
| `error` | Red (`#de350b`) | API errors, validation failures |

---

## Actions

| Action | Type | Description |
|--------|------|-------------|
| `addToast` | Reducer | Add new notification to stack |
| `removeToast` | Reducer | Remove notification by ID |
| `clearAllToasts` | Reducer | Remove all notifications |

---

## Components

### ToastContainer

Container component that renders all active toasts.

| Feature | Description |
|---------|-------------|
| Position | Fixed, top-right corner |
| Stacking | Multiple toasts stack vertically |
| Animation | Slide-in from right |
| Z-Index | High (above all content) |

### ToastItem

Individual toast notification component.

| Element | Description |
|---------|-------------|
| Icon | Type-specific icon (checkmark, info, warning, error) |
| Message | Toast message text |
| Close Button | × button in top-right |
| Background | Color based on type |

---

## Notification Rules (from PDF Section 10)

| Rule | Implementation |
|------|---------------|
| Position | Fixed top-right corner |
| Auto-dismiss | **NO** - User must click × to close |
| Stacking | Multiple toasts stack vertically |
| Animation | Slide-in from right |
| Close button | × button in top-right of each toast |
| Persistence | Stays visible until manually closed |

---

## SignalR Event Mapping

| SignalR Event | Toast Type | Message Template |
|---------------|------------|------------------|
| `TaskCreated` | Success | "Task created: {title}" |
| `TaskAssigned` | Info | "You have been assigned to: {title}" |
| `TaskUpdated` | Info | "Task '{title}' status updated to: {status}" |
| `TaskDeleted` | Warning | "Task deleted: {title}" |

---

## API Error Mapping

| HTTP Status | Toast Type | Message |
|-------------|------------|---------|
| 400 | Error | Validation error details |
| 401 | Error | "Session expired. Please login again." |
| 403 | Error | "Access denied." |
| 404 | Error | "Resource not found." |
| 500 | Error | "Something went wrong. Please try again." |

---

## Usage Examples

### Adding a Toast (from SignalR handler)

```typescript
// In signalr.ts
connection.on('TaskCreated', (task) => {
  store.dispatch(addToast({
    type: 'success',
    message: `Task created: ${task.title}`
  }));
  store.dispatch(taskCreated(task));
});
```

### Adding a Toast (from API error)

```typescript
// In API interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    store.dispatch(addToast({
      type: 'error',
      message: error.response?.data?.message || 'Something went wrong'
    }));
    return Promise.reject(error);
  }
);
```

### Removing a Toast

```typescript
// In ToastItem component
const handleClose = () => {
  dispatch(removeToast(toast.id));
};
```

---

## Styling

### Toast Colors

| Type | Background | Text | Border |
|------|------------|------|--------|
| Success | `#e3fcef` | `#00875a` | `#00875a` |
| Info | `#deebff` | `#0052cc` | `#0052cc` |
| Warning | `#fff0b3` | `#ff991f` | `#ff991f` |
| Error | `#ffebe6` | `#de350b` | `#de350b` |

### Layout

```css
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast-item {
  min-width: 300px;
  max-width: 400px;
  padding: 16px;
  border-radius: 4px;
  border-left: 4px solid;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

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
```

---

## Related Documentation

- [Frontend Architecture](../Frontend-Architecture.md)
- [Toast Notifications API Contract](../../api-contracts/07-Toast-Notifications-Contract.md)
- [Tasks Feature](./Tasks.md) - SignalR events trigger toasts
