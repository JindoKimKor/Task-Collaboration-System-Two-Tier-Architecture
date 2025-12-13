# RegisterForm - Method Connections

## Complete Method Map by File

```mermaid
flowchart TB
    subgraph TYPES["types.ts (No Methods)"]
        direction LR
        T1["RegisterFormData"]
        T2["RegisterFormProps"]
        T3["ValidationErrors"]
        T4["FormInputProps"]
    end

    subgraph VALIDATION["validation.ts"]
        direction TB
        VF["validateField(name, value, formData?)<br/>─────────────<br/>Returns: string | undefined"]
        VA["validateForm(data)<br/>─────────────<br/>Returns: ValidationErrors"]
    end

    subgraph HOOK["useRegisterForm.ts"]
        direction TB
        URF["useRegisterForm(onSubmit)"]
        HC["handleChange(e)"]
        HB["handleBlur(e)"]
        HS["handleSubmit(e)"]
        SFD["setFormData()"]
        SER["setErrors()"]
        STO["setTouched()"]
    end

    subgraph FORMINPUT["FormInput.tsx"]
        FI["FormInput(props)<br/>─────────────<br/>Returns: JSX.Element"]
    end

    subgraph REGISTERFORM["RegisterForm.tsx"]
        RF["RegisterForm(props)<br/>─────────────<br/>Returns: JSX.Element"]
        SHOW["showError(field)<br/>─────────────<br/>Returns: string | undefined"]
    end

    subgraph INDEX["index.ts (No Methods)"]
        direction LR
        EX1["export RegisterForm"]
        EX2["export FormInput"]
        EX3["export useRegisterForm"]
        EX4["export types"]
    end

    VA -->|"calls internally"| VF
    URF -->|"returns"| HC
    URF -->|"returns"| HB
    URF -->|"returns"| HS
    HC -->|"calls"| SFD
    HC -->|"calls"| SER
    HB -->|"calls"| STO
    HB -->|"calls"| VF
    HB -->|"calls"| SER
    HS -->|"calls"| VA
    HS -->|"calls"| SER
    HS -->|"calls"| STO
    RF -->|"calls"| URF
    RF -->|"uses"| SHOW
    RF -->|"renders"| FI
```

---

## Use Case 1: User Types in Input

```mermaid
flowchart LR
    subgraph TRIGGER["Trigger"]
        User["User types 'J'"]
    end

    subgraph FORMINPUT["FormInput.tsx"]
        Input["&lt;input onChange={onChange} /&gt;"]
    end

    subgraph HOOK["useRegisterForm.ts"]
        HC["handleChange(e)"]
        SFD["setFormData()"]
        SER["setErrors()"]
    end

    subgraph RESULT["Result"]
        Render["Re-render with new value"]
    end

    User -->|"DOM event"| Input
    Input -->|"onChange"| HC
    HC -->|"1"| SFD
    HC -->|"2"| SER
    SER --> Render
```

**Method Chain:** `onChange` → `handleChange()` → `setFormData()` → `setErrors()`

---

## Use Case 2: User Leaves Input (Blur)

```mermaid
flowchart LR
    subgraph TRIGGER["Trigger"]
        User["User leaves field"]
    end

    subgraph FORMINPUT["FormInput.tsx"]
        Input["&lt;input onBlur={onBlur} /&gt;"]
    end

    subgraph HOOK["useRegisterForm.ts"]
        HB["handleBlur(e)"]
        STO["setTouched()"]
        SER["setErrors()"]
    end

    subgraph VALIDATION["validation.ts"]
        VF["validateField()"]
    end

    subgraph RESULT["Result"]
        Render["Show error if invalid"]
    end

    User -->|"DOM event"| Input
    Input -->|"onBlur"| HB
    HB -->|"1"| STO
    HB -->|"2"| VF
    VF -->|"error string"| HB
    HB -->|"3"| SER
    SER --> Render
```

**Method Chain:** `onBlur` → `handleBlur()` → `setTouched()` → `validateField()` → `setErrors()`

---

## Use Case 3: User Submits Form (Valid)

```mermaid
flowchart LR
    subgraph TRIGGER["Trigger"]
        User["User clicks Register"]
    end

    subgraph REGISTERFORM["RegisterForm.tsx"]
        Form["&lt;form onSubmit={handleSubmit}&gt;"]
    end

    subgraph HOOK["useRegisterForm.ts"]
        HS["handleSubmit(e)"]
        SER["setErrors()"]
        STO["setTouched()"]
    end

    subgraph VALIDATION["validation.ts"]
        VA["validateForm()"]
        VF["validateField() x5"]
    end

    subgraph PARENT["Parent Component"]
        CB["onSubmit(formData)"]
    end

    User -->|"DOM event"| Form
    Form -->|"onSubmit"| HS
    HS -->|"1"| VA
    VA -->|"calls"| VF
    VF -->|"{} empty"| VA
    VA -->|"{} empty"| HS
    HS -->|"2"| SER
    HS -->|"3"| STO
    HS -->|"4 (valid)"| CB
```

**Method Chain:** `onSubmit` → `handleSubmit()` → `validateForm()` → `validateField()` x5 → `setErrors()` → `setTouched()` → `onSubmit(callback)`

---

## Use Case 4: User Submits Form (Invalid)

```mermaid
flowchart LR
    subgraph TRIGGER["Trigger"]
        User["User clicks Register"]
    end

    subgraph REGISTERFORM["RegisterForm.tsx"]
        Form["&lt;form onSubmit={handleSubmit}&gt;"]
    end

    subgraph HOOK["useRegisterForm.ts"]
        HS["handleSubmit(e)"]
        SER["setErrors()"]
        STO["setTouched()"]
    end

    subgraph VALIDATION["validation.ts"]
        VA["validateForm()"]
        VF["validateField() x5"]
    end

    subgraph RESULT["Result"]
        Render["Show errors, NO callback"]
    end

    User -->|"DOM event"| Form
    Form -->|"onSubmit"| HS
    HS -->|"1"| VA
    VA -->|"calls"| VF
    VF -->|"{ password: '...' }"| VA
    VA -->|"errors object"| HS
    HS -->|"2"| SER
    HS -->|"3"| STO
    HS -->|"4 (invalid)"| Render
```

**Method Chain:** `onSubmit` → `handleSubmit()` → `validateForm()` → `validateField()` x5 → `setErrors()` → `setTouched()` → **STOP**

---

## Use Case 5: Server Returns Error

```mermaid
flowchart LR
    subgraph PARENT["Parent Component"]
        API["api.register()"]
        SE["setError()"]
    end

    subgraph REGISTERFORM["RegisterForm.tsx"]
        Props["error prop"]
        JSX["{ error && &lt;div&gt;{error}&lt;/div&gt; }"]
    end

    subgraph RESULT["Result"]
        Render["Show server error"]
    end

    API -->|"throws"| SE
    SE -->|"state update"| Props
    Props -->|"render"| JSX
    JSX --> Render
```

**Method Chain:** `api.register()` → `catch` → `setError()` → `error prop` → JSX render

---

## Method Dependency Graph

```mermaid
flowchart TB
    subgraph L1["Layer 1: Pure Functions"]
        VF["validateField()"]
        VA["validateForm()"]
    end

    subgraph L2["Layer 2: State Setters"]
        SFD["setFormData()"]
        SER["setErrors()"]
        STO["setTouched()"]
    end

    subgraph L3["Layer 3: Event Handlers"]
        HC["handleChange()"]
        HB["handleBlur()"]
        HS["handleSubmit()"]
    end

    subgraph L4["Layer 4: Hook"]
        URF["useRegisterForm()"]
    end

    subgraph L5["Layer 5: Components"]
        FI["FormInput()"]
        RF["RegisterForm()"]
        SHOW["showError()"]
    end

    VA --> VF
    HC --> SFD
    HC --> SER
    HB --> STO
    HB --> VF
    HB --> SER
    HS --> VA
    HS --> SER
    HS --> STO
    URF --> HC
    URF --> HB
    URF --> HS
    RF --> URF
    RF --> SHOW
    RF --> FI
```

---

## Summary: Methods per File

| File | Methods | Called By | Calls |
|------|---------|-----------|-------|
| `types.ts` | (none - types only) | - | - |
| `validation.ts` | `validateField()`, `validateForm()` | useRegisterForm | - |
| `useRegisterForm.ts` | `handleChange()`, `handleBlur()`, `handleSubmit()` | RegisterForm | validation, setState |
| `FormInput.tsx` | `FormInput()` | RegisterForm | - |
| `RegisterForm.tsx` | `RegisterForm()`, `showError()` | Parent | useRegisterForm, FormInput |
| `index.ts` | (none - exports only) | - | - |
