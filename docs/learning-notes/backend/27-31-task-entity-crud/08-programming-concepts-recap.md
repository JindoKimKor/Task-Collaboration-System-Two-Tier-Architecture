# Programming Concepts Recap (Language Agnostic)

## Overview

These are fundamental programming concepts that apply across all programming languages. Understanding these concepts helps you write better code in any language.

---

## 1. Abstraction

```mermaid
flowchart TB
    subgraph ABSTRACTION["Abstraction"]
        direction TB
        Definition["Hide complex implementation details<br/>Expose only necessary interface"]

        High["High-Level (What)"]
        Low["Low-Level (How)"]

        Example["Example:<br/>───────────<br/>ITaskService.CreateTaskAsync()<br/>↓<br/>Hides: validation, mapping,<br/>database operations, etc."]
    end

    High -->|"hides"| Low
```

**Concept:**
- Hide complexity behind simple interfaces
- User of abstraction doesn't need to know implementation
- Change implementation without affecting clients

**Real-World Analogy:**
- Driving a car: You use steering wheel and pedals (interface)
- You don't need to know how engine works (implementation)

---

## 2. Encapsulation

```mermaid
flowchart TB
    subgraph ENCAPSULATION["Encapsulation"]
        direction TB

        subgraph INTERNAL["Internal (Hidden)"]
            Private["private _unitOfWork<br/>private MapToDto()"]
        end

        subgraph EXTERNAL["External (Exposed)"]
            Public["public CreateTaskAsync()<br/>public GetTasksAsync()"]
        end
    end

    EXTERNAL -->|"uses"| INTERNAL
```

**Concept:**
- Bundle data and methods that operate on that data
- Restrict direct access to internal state
- Control how data is modified

**Access Levels (Common):**
| Level | Visibility |
|-------|------------|
| Public | Anywhere |
| Private | Same class only |
| Protected | Same class + subclasses |
| Internal | Same module/assembly |

---

## 3. Inheritance

```mermaid
flowchart TB
    subgraph INHERITANCE["Inheritance"]
        direction TB
        Parent["Base Class<br/>───────────<br/>Repository‹T›<br/>+GetByIdAsync()<br/>+AddAsync()"]

        Child["Derived Class<br/>───────────<br/>TaskRepository<br/>+GetPagedAsync()<br/>+inherited methods"]
    end

    Child -->|"extends"| Parent
```

**Concept:**
- Create new class based on existing class
- Inherit properties and methods from parent
- Add or override behavior in child

**Types:**
- Single Inheritance: One parent class
- Multiple Inheritance: Multiple parents (interfaces in most languages)
- Hierarchical: One parent, multiple children

---

## 4. Polymorphism

```mermaid
flowchart TB
    subgraph POLYMORPHISM["Polymorphism"]
        direction TB
        Interface["ITaskService<br/>───────────<br/>+CreateTaskAsync()"]

        Impl1["TaskService<br/>───────────<br/>Production implementation"]

        Impl2["MockTaskService<br/>───────────<br/>Test implementation"]

        Usage["Code uses ITaskService<br/>───────────<br/>Works with ANY implementation"]
    end

    Impl1 -->|implements| Interface
    Impl2 -->|implements| Interface
    Usage -->|"uses"| Interface
```

**Concept:**
- "Many forms" - same interface, different implementations
- Code works with base type, gets specific behavior
- Enables flexibility and extensibility

**Types:**
- Compile-time (Method Overloading)
- Runtime (Method Overriding, Interfaces)

---

## 5. Composition over Inheritance

```mermaid
flowchart LR
    subgraph INHERITANCE_APPROACH["❌ Inheritance"]
        TaskService1["TaskService<br/>extends LoggingService<br/>extends ValidationService"]
    end

    subgraph COMPOSITION_APPROACH["✅ Composition"]
        TaskService2["TaskService<br/>───────────<br/>-_logger: ILogger<br/>-_validator: IValidator<br/>-_repository: IRepository"]
    end
```

**Concept:**
- Prefer "has-a" relationships over "is-a"
- Combine simple objects to build complex ones
- More flexible than deep inheritance hierarchies

**Benefits:**
- Looser coupling
- Easier to change
- More testable

---

## 6. Separation of Concerns (SoC)

```mermaid
flowchart TB
    subgraph SOC["Separation of Concerns"]
        direction LR

        Presentation["Presentation<br/>───────────<br/>HTTP handling<br/>Request/Response"]

        Business["Business Logic<br/>───────────<br/>Rules<br/>Authorization"]

        Data["Data Access<br/>───────────<br/>Database operations<br/>Queries"]
    end

    Presentation -->|"delegates"| Business
    Business -->|"uses"| Data
```

**Concept:**
- Each module handles one concern
- Don't mix unrelated responsibilities
- Changes in one area don't affect others

**Our Implementation:**
| Layer | Concern |
|-------|---------|
| Controller | HTTP |
| Service | Business Logic |
| Repository | Data Access |
| Entity | Data Structure |
| DTO | Data Transfer |

---

## 7. DRY (Don't Repeat Yourself)

```mermaid
flowchart LR
    subgraph WET["❌ WET (Write Everything Twice)"]
        Code1["GetTaskById:<br/>map to DTO"]
        Code2["CreateTask:<br/>map to DTO (same code)"]
        Code3["UpdateTask:<br/>map to DTO (same code)"]
    end

    subgraph DRY["✅ DRY"]
        Single["MapToResponseDto()<br/>───────────<br/>Reusable method"]
        Use1["GetTaskById → uses"]
        Use2["CreateTask → uses"]
        Use3["UpdateTask → uses"]
    end

    WET -->|"refactor to"| DRY
```

**Concept:**
- Every piece of knowledge has single representation
- Avoid code duplication
- Extract common logic into reusable units

**Caveat:**
- Don't over-DRY: premature abstraction is also bad
- Some duplication is acceptable if contexts are different

---

## 8. KISS (Keep It Simple, Stupid)

```mermaid
flowchart LR
    subgraph COMPLEX["❌ Over-Engineered"]
        C1["AbstractTaskFactoryBuilder<br/>TaskCreationStrategyProvider<br/>ValidationPipelineOrchestrator"]
    end

    subgraph SIMPLE["✅ Simple"]
        S1["TaskService.CreateTaskAsync()<br/>───────────<br/>Does one thing clearly"]
    end
```

**Concept:**
- Simplest solution that works
- Avoid unnecessary complexity
- Easy to understand = easy to maintain

**Questions to Ask:**
- Do I really need this abstraction?
- Can someone else understand this easily?
- Am I solving a real problem or imaginary one?

---

## 9. YAGNI (You Aren't Gonna Need It)

```mermaid
flowchart TB
    subgraph YAGNI["YAGNI Principle"]
        direction TB
        Needed["✅ Implement Now<br/>───────────<br/>Features actually<br/>required today"]

        Future["❌ Don't Implement<br/>───────────<br/>Features you 'might'<br/>need someday"]
    end
```

**Concept:**
- Don't implement features until needed
- Avoid speculative development
- Requirements change - don't waste time

**Examples:**
- Don't add caching "just in case"
- Don't create abstract factory for single implementation
- Don't add configuration for hardcoded values

---

## 10. Dependency Inversion

```mermaid
flowchart TB
    subgraph WRONG["❌ High-Level Depends on Low-Level"]
        TaskService1["TaskService"]
        TaskRepository1["TaskRepository<br/>(concrete)"]
        TaskService1 -->|"depends on"| TaskRepository1
    end

    subgraph CORRECT["✅ Both Depend on Abstraction"]
        TaskService2["TaskService"]
        Interface["ITaskRepository<br/>«interface»"]
        TaskRepository2["TaskRepository"]

        TaskService2 -->|"depends on"| Interface
        TaskRepository2 -->|"implements"| Interface
    end
```

**Concept:**
- High-level modules shouldn't depend on low-level modules
- Both should depend on abstractions
- Abstractions shouldn't depend on details

---

## 11. Cohesion and Coupling

```mermaid
flowchart TB
    subgraph COHESION["High Cohesion ✅"]
        direction TB
        TaskService["TaskService<br/>───────────<br/>CreateTask()<br/>UpdateTask()<br/>DeleteTask()<br/>GetTasks()<br/>───────────<br/>All task-related!"]
    end

    subgraph COUPLING["Loose Coupling ✅"]
        direction LR
        Service["TaskService"]
        Interface["ITaskRepository"]
        Repo["TaskRepository"]

        Service -->|"knows only"| Interface
        Repo -.->|"hidden"| Interface
    end
```

**Cohesion:**
- How related are elements within a module
- High cohesion = module does one thing well
- Low cohesion = module does unrelated things

**Coupling:**
- How dependent are modules on each other
- Loose coupling = easy to change independently
- Tight coupling = changes ripple through system

---

## 12. Single Source of Truth (SSOT)

```mermaid
flowchart TB
    subgraph SSOT["Single Source of Truth"]
        direction TB
        Truth["Database<br/>───────────<br/>Authoritative source<br/>for task data"]

        Cache["Cache<br/>───────────<br/>Derived from Truth"]

        DTO["DTO<br/>───────────<br/>Derived from Truth"]

        UI["UI State<br/>───────────<br/>Derived from Truth"]
    end

    Truth -->|"derives"| Cache
    Truth -->|"derives"| DTO
    Truth -->|"derives"| UI
```

**Concept:**
- One authoritative source for each piece of data
- Other representations are derived
- Prevents inconsistency

---

## 13. Fail Fast

```mermaid
flowchart TB
    subgraph FAILFAST["Fail Fast Principle"]
        direction TB
        Input["Input Received"]

        Validate["Validate Early<br/>───────────<br/>Check at entry point"]

        Fail["❌ Fail Immediately<br/>if invalid"]

        Process["✅ Process<br/>if valid"]
    end

    Input --> Validate
    Validate -->|"invalid"| Fail
    Validate -->|"valid"| Process
```

**Concept:**
- Detect and report errors as early as possible
- Don't let invalid data propagate
- Clear error messages at point of failure

**Example:**
```
// Fail fast - check at API entry
[ApiController] validates request immediately
→ 400 Bad Request with clear error

// vs. failing later
Save to database
→ Cryptic database constraint error
```

---

## 14. Idempotency

```mermaid
flowchart LR
    subgraph IDEMPOTENT["Idempotent Operations"]
        direction TB
        GET["GET /tasks/5<br/>───────────<br/>Same result every time<br/>✅ Idempotent"]

        PUT["PUT /tasks/5<br/>───────────<br/>Same final state<br/>✅ Idempotent"]

        DELETE["DELETE /tasks/5<br/>───────────<br/>Same result (deleted)<br/>✅ Idempotent"]
    end

    subgraph NOT_IDEMPOTENT["Non-Idempotent"]
        POST["POST /tasks<br/>───────────<br/>Creates new each time<br/>❌ Not idempotent"]
    end
```

**Concept:**
- Operation can be applied multiple times with same result
- Important for retry logic and reliability
- HTTP: GET, PUT, DELETE are idempotent; POST is not

---

## 15. Immutability

```mermaid
flowchart LR
    subgraph MUTABLE["❌ Mutable"]
        M1["var task = new Task()<br/>task.Title = 'A'<br/>task.Title = 'B'  // changed!"]
    end

    subgraph IMMUTABLE["✅ Immutable"]
        I1["var task1 = new Task('A')<br/>var task2 = task1 with { Title = 'B' }<br/>// task1 unchanged"]
    end
```

**Concept:**
- Once created, object cannot be modified
- Create new object instead of modifying
- Prevents unexpected side effects

**Benefits:**
- Thread-safe by default
- Easier to reason about
- No defensive copying needed

---

## 16. Error Handling Strategies

```mermaid
flowchart TB
    subgraph STRATEGIES["Error Handling"]
        direction TB

        Exception["Exception-Based<br/>───────────<br/>throw new NotFoundException()<br/>catch and handle"]

        Result["Result-Based<br/>───────────<br/>return Result.Failure('Not found')<br/>check result.IsSuccess"]

        Null["Null Return<br/>───────────<br/>return null if not found<br/>caller checks for null"]
    end
```

**Our Approach (Exception-Based):**
```
Service: throw KeyNotFoundException
    ↓
Controller: catch → return NotFound()
    ↓
Client: 404 response
```

**Trade-offs:**
| Strategy | Pros | Cons |
|----------|------|------|
| Exception | Clear flow control | Performance overhead |
| Result | Explicit, no throw | Verbose, must check |
| Null | Simple | Null reference risks |

---

## Concept Relationships

```mermaid
flowchart TB
    subgraph FOUNDATIONS["Foundation Concepts"]
        Abstraction["Abstraction"]
        Encapsulation["Encapsulation"]
        Inheritance["Inheritance"]
        Polymorphism["Polymorphism"]
    end

    subgraph PRINCIPLES["Design Principles"]
        SoC["Separation of Concerns"]
        DRY["DRY"]
        KISS["KISS"]
        YAGNI["YAGNI"]
    end

    subgraph QUALITY["Quality Attributes"]
        Cohesion["High Cohesion"]
        Coupling["Loose Coupling"]
        SSOT["Single Source of Truth"]
    end

    FOUNDATIONS -->|"enable"| PRINCIPLES
    PRINCIPLES -->|"achieve"| QUALITY
```

---

## Summary Table

| Concept | One-Line Definition |
|---------|---------------------|
| Abstraction | Hide complexity, show only what's needed |
| Encapsulation | Bundle data + behavior, control access |
| Inheritance | Create new types based on existing ones |
| Polymorphism | Same interface, different implementations |
| Composition | Build complex from simple (has-a) |
| SoC | One module, one responsibility |
| DRY | Single representation of knowledge |
| KISS | Simplest solution that works |
| YAGNI | Don't build what you don't need yet |
| Dependency Inversion | Depend on abstractions, not concretions |
| Cohesion | Elements in module are related |
| Coupling | Modules are independent |
| SSOT | One authoritative data source |
| Fail Fast | Detect errors early |
| Idempotency | Same operation, same result |
| Immutability | Objects don't change after creation |
