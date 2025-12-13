# Design Patterns

## Patterns Used

### 1. Conditional Rendering Pattern

```mermaid
flowchart TB
    subgraph PATTERN["Conditional Rendering"]
        direction TB
        Condition["task.isArchived"]
        True["Render badge"]
        False["Render nothing (null)"]
    end

    Condition -->|"true"| True
    Condition -->|"false"| False
```

**Implementation:**
```tsx
{task.isArchived && (
  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
    Archived
  </span>
)}
```

**Pattern Explanation:**
- `condition && <Component />` - Short-circuit evaluation
- If `task.isArchived` is false → returns false (renders nothing)
- If `task.isArchived` is true → returns JSX element

---

### 2. Conditional Class Pattern (Template Literal)

```mermaid
flowchart TB
    subgraph PATTERN["Conditional Class"]
        direction TB
        Base["Base classes<br/>───────────<br/>Always applied"]
        Conditional["Conditional class<br/>───────────<br/>Applied if condition true"]
        Result["Final className"]
    end

    Base --> Result
    Conditional -->|"condition ? 'class' : ''"| Result
```

**Implementation:**
```tsx
className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer
           hover:shadow-md hover:border-gray-300 transition-all duration-200
           ${task.isArchived ? "opacity-50" : ""}`}
```

**Pattern Breakdown:**
| Part | Description |
|------|-------------|
| Backticks `` ` `` | Template literal for string interpolation |
| `${...}` | JavaScript expression insertion |
| `condition ? "class" : ""` | Ternary for conditional class |

---

### 3. Presentational Component Pattern

```mermaid
flowchart TB
    subgraph PATTERN["Presentational Component"]
        direction TB
        Props["Props Input<br/>───────────<br/>task: TaskResponseDto"]
        Render["Pure Rendering<br/>───────────<br/>JSX based on props"]
        NoState["No Internal State<br/>───────────<br/>No side effects"]
    end

    Props --> Render
    Render --> NoState
```

**TaskCard Characteristics:**
- Receives `task` and `onClick` as props
- Renders UI based solely on props
- No `useState`, no `useEffect`
- Pure function of props → JSX

---

### 4. Badge UI Pattern

```mermaid
flowchart LR
    subgraph BADGES["Badge Pattern"]
        direction TB
        ID["#1<br/>───────────<br/>Task identifier"]
        Status["Archived<br/>───────────<br/>State indicator"]
    end
```

**Consistent Styling:**
```tsx
// Task ID Badge
<span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
  #{task.id}
</span>

// Archived Badge (same base style)
<span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
  Archived
</span>
```

**Shared Styles:**
| Class | Purpose |
|-------|---------|
| `text-xs` | Small font size |
| `font-medium` | Medium weight |
| `bg-gray-100` | Light gray background |
| `px-2 py-0.5` | Horizontal/vertical padding |
| `rounded` | Rounded corners |

---

## Anti-Patterns Avoided

```mermaid
flowchart LR
    subgraph AVOID["Anti-Patterns"]
        Inline["Inline style objects<br/>style={{opacity: 0.5}}"]
        ComplexTernary["Nested ternaries<br/>Hard to read"]
        DirectMutation["Mutating props<br/>task.isArchived = false"]
    end

    subgraph CORRECT["Correct Patterns"]
        TailwindClass["Tailwind classes<br/>className='opacity-50'"]
        SimpleCondition["Simple && or ternary<br/>Clear logic"]
        ReadOnlyProps["Read-only props<br/>Never modify"]
    end

    Inline -->|"Use"| TailwindClass
    ComplexTernary -->|"Use"| SimpleCondition
    DirectMutation -->|"Use"| ReadOnlyProps
```
