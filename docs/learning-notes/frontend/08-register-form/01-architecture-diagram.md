# RegisterForm - Architecture Diagram

## File Structure

```
src/features/auth/
├── components/
│   ├── FormInput.tsx         ← Reusable input UI
│   └── RegisterForm.tsx      ← Form composition
├── hooks/
│   └── useRegisterForm.ts    ← State management
├── utils/
│   └── validation.ts         ← Validation logic
├── types.ts                  ← Type definitions
└── index.ts                  ← Barrel export
```

---

## Component Architecture

```mermaid
flowchart TB
    subgraph FEATURE["src/features/auth/"]
        direction TB

        subgraph TYPES["types.ts"]
            T1["RegisterFormData"]
            T2["RegisterFormProps"]
            T3["ValidationErrors"]
            T4["FormInputProps"]
        end

        subgraph UTILS["utils/validation.ts"]
            V1["validateField()"]
            V2["validateForm()"]
        end

        subgraph HOOKS["hooks/useRegisterForm.ts"]
            H1["formData state"]
            H2["errors state"]
            H3["touched state"]
            H4["handleChange()"]
            H5["handleBlur()"]
            H6["handleSubmit()"]
        end

        subgraph COMPONENTS["components/"]
            FI["FormInput.tsx<br/>─────────────<br/>Reusable input UI"]
            RF["RegisterForm.tsx<br/>─────────────<br/>Form composition"]
        end

        subgraph EXPORT["index.ts"]
            EX["Barrel export"]
        end
    end

    TYPES --> UTILS
    TYPES --> HOOKS
    UTILS --> HOOKS
    TYPES --> FI
    HOOKS --> RF
    FI --> RF
    RF --> EXPORT
```

---

## Dependency Flow (Bottom-Up)

```mermaid
flowchart BT
    subgraph L1["Layer 1: No Dependencies"]
        Types["types.ts<br/>─────────────<br/>Pure type definitions"]
    end

    subgraph L2["Layer 2: Types Only"]
        Validation["validation.ts<br/>─────────────<br/>Pure functions"]
        FormInput["FormInput.tsx<br/>─────────────<br/>Presentational"]
    end

    subgraph L3["Layer 3: Types + Validation"]
        Hook["useRegisterForm.ts<br/>─────────────<br/>State + Logic"]
    end

    subgraph L4["Layer 4: Hook + FormInput"]
        Form["RegisterForm.tsx<br/>─────────────<br/>Composition"]
    end

    subgraph L5["Layer 5: Export"]
        Index["index.ts<br/>─────────────<br/>Public API"]
    end

    Types --> Validation
    Types --> FormInput
    Types --> Hook
    Validation --> Hook
    Hook --> Form
    FormInput --> Form
    Form --> Index
```

---

## Data Flow

```mermaid
flowchart LR
    subgraph USER["User Action"]
        Input["Type in input"]
        Blur["Leave input"]
        Submit["Click Register"]
    end

    subgraph HOOK["useRegisterForm"]
        HC["handleChange()"]
        HB["handleBlur()"]
        HS["handleSubmit()"]
    end

    subgraph STATE["React State"]
        FD["formData"]
        ER["errors"]
        TO["touched"]
    end

    subgraph VALIDATION["validation.ts"]
        VF["validateField()"]
        VA["validateForm()"]
    end

    subgraph OUTPUT["Result"]
        Render["Re-render UI"]
        Callback["onSubmit(data)"]
    end

    Input --> HC --> FD --> Render
    Blur --> HB --> VF --> ER --> Render
    Submit --> HS --> VA --> ER
    HS -->|"valid"| Callback
```

---

## Component Composition

```mermaid
flowchart TB
    subgraph REGISTERFORM["RegisterForm.tsx"]
        direction TB

        subgraph HOOK_CALL["useRegisterForm(onSubmit)"]
            Returns["returns: formData, errors, touched,<br/>handleChange, handleBlur, handleSubmit"]
        end

        subgraph JSX["JSX Structure"]
            Form["<form onSubmit={handleSubmit}>"]

            subgraph INPUTS["FormInput Components"]
                I1["<FormInput name='name' ... />"]
                I2["<FormInput name='email' ... />"]
                I3["<FormInput name='username' ... />"]
                I4["<FormInput name='password' ... />"]
                I5["<FormInput name='confirmPassword' ... />"]
            end

            Button["<button type='submit'>Register</button>"]
        end
    end

    HOOK_CALL --> JSX
    Form --> INPUTS --> Button
```

---

## Props Flow

```mermaid
flowchart TB
    subgraph PARENT["Parent (RegisterPage - Future Task #10)"]
        OnSubmit["onSubmit: (data) => dispatch(register(data))"]
        Loading["loading: authState.loading"]
        Error["error: authState.error"]
    end

    subgraph REGISTERFORM["RegisterForm"]
        Props["props: { onSubmit, loading, error }"]
        Hook["useRegisterForm(onSubmit)"]
        UI["Render form UI"]
    end

    subgraph FORMINPUT["FormInput (x5)"]
        InputProps["props: { name, label, type,<br/>value, error, disabled,<br/>onChange, onBlur }"]
    end

    PARENT -->|"props"| Props
    Props --> Hook
    Hook --> UI
    UI -->|"props"| InputProps
```

---

## Validation Flow

```mermaid
flowchart TB
    subgraph TRIGGER["Validation Triggers"]
        OnBlur["onBlur<br/>─────────────<br/>Single field validation"]
        OnSubmit["onSubmit<br/>─────────────<br/>Full form validation"]
    end

    subgraph VALIDATION["validation.ts"]
        ValidateField["validateField(name, value, formData)<br/>─────────────<br/>Returns: string | undefined"]
        ValidateForm["validateForm(data)<br/>─────────────<br/>Returns: ValidationErrors"]
    end

    subgraph RULES["Validation Rules"]
        direction LR
        R1["Name: required, max 100"]
        R2["Email: required, email format"]
        R3["Username: required, 3-50 chars"]
        R4["Password: required, min 8"]
        R5["Confirm: required, match password"]
    end

    subgraph RESULT["Result"]
        SetErrors["setErrors(errors)"]
        ShowError["Show error under input"]
    end

    OnBlur --> ValidateField
    OnSubmit --> ValidateForm
    ValidateField --> RULES
    ValidateForm --> RULES
    RULES --> SetErrors --> ShowError
```

---

## File Responsibilities (SRP)

| File | Single Responsibility |
|------|----------------------|
| `types.ts` | Type definitions only |
| `validation.ts` | Validation rules only (pure functions) |
| `useRegisterForm.ts` | Form state management only |
| `FormInput.tsx` | Input UI rendering only |
| `RegisterForm.tsx` | Form composition only |
| `index.ts` | Public API export only |

---

## Comparison: Monolithic vs SRP

```mermaid
flowchart LR
    subgraph MONO["Monolithic (180+ lines)"]
        direction TB
        M1["RegisterForm.tsx<br/>─────────────<br/>• Types<br/>• Validation<br/>• State<br/>• Handlers<br/>• UI<br/>• Styling"]
    end

    subgraph SRP["SRP (30-50 lines each)"]
        direction TB
        S1["types.ts"]
        S2["validation.ts"]
        S3["useRegisterForm.ts"]
        S4["FormInput.tsx"]
        S5["RegisterForm.tsx"]
    end

    MONO -->|"Refactor"| SRP
```

| Aspect | Monolithic | SRP |
|--------|------------|-----|
| Lines per file | 180+ | 30-50 |
| Testability | Hard | Easy |
| Reusability | Copy-paste | Import |
| Readability | Scroll a lot | Clear focus |
| Maintenance | One change affects all | Isolated changes |
