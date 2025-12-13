# Archived Task Visual Indicator Implementation Plan

## Overview

Task #67: Add visual indicator for archived tasks in TaskCard component.

## Implementation Flow

```mermaid
flowchart TB
    subgraph STEP1["Step 1: TaskCard Styling"]
        direction TB
        Opacity["Conditional opacity-50<br/>───────────<br/>Faded appearance"]
        Badge["Archived badge<br/>───────────<br/>Visual label"]
    end

    STEP1
```

---

## File Implementation

### Step 1: TaskCard.tsx

**Location:** `src/features/task/components/TaskCard.tsx`

**Changes:**

#### 1.1 Conditional Opacity

**Before:**
```tsx
<div
  onClick={onClick}
  className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer
             hover:shadow-md hover:border-gray-300 transition-all duration-200"
>
```

**After:**
```tsx
<div
  onClick={onClick}
  className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer
             hover:shadow-md hover:border-gray-300 transition-all duration-200
             ${task.isArchived ? "opacity-50" : ""}`}
>
```

---

#### 1.2 Archived Badge

**Before:**
```tsx
{/* Task ID Badge */}
<div className="flex items-center justify-between mb-2">
  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
    #{task.id}
  </span>
</div>
```

**After:**
```tsx
{/* Task ID Badge */}
<div className="flex items-center justify-between mb-2">
  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
    #{task.id}
  </span>
  {task.isArchived && (
    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
      Archived
    </span>
  )}
</div>
```

---

## Visual Comparison

```mermaid
flowchart LR
    subgraph NORMAL["Normal Task"]
        N_Card["TaskCard<br/>───────────<br/>opacity: 100%<br/>No badge"]
    end

    subgraph ARCHIVED["Archived Task"]
        A_Card["TaskCard<br/>───────────<br/>opacity: 50%<br/>'Archived' badge"]
    end
```

---

## Data Flow

```mermaid
flowchart TB
    subgraph BACKEND["Backend"]
        DB["Database<br/>───────────<br/>IsArchived: true"]
        API["API Response<br/>───────────<br/>isArchived: true"]
    end

    subgraph FRONTEND["Frontend"]
        Redux["Redux Store<br/>───────────<br/>tasks[].isArchived"]
        TaskCard["TaskCard<br/>───────────<br/>task.isArchived"]
        UI["UI Rendering<br/>───────────<br/>Conditional styling"]
    end

    DB --> API
    API --> Redux
    Redux --> TaskCard
    TaskCard --> UI
```

---

## Checklist

- [x] Add conditional opacity-50 class for archived tasks
- [x] Add "Archived" badge when task.isArchived is true
- [x] Build verification
