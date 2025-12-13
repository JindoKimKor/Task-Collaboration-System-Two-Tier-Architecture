# RegisterForm - Design Patterns & SOLID Principles

## SOLID Principles Applied

### S - Single Responsibility Principle

Each file has **one reason to change**:

```mermaid
flowchart TB
    subgraph SRP["Single Responsibility Principle"]
        direction TB

        subgraph TYPES["types.ts"]
            T["Changes when:<br/>• Form fields change<br/>• Props interface changes"]
        end

        subgraph VALIDATION["validation.ts"]
            V["Changes when:<br/>• Validation rules change<br/>• New validation added"]
        end

        subgraph HOOK["useRegisterForm.ts"]
            H["Changes when:<br/>• State logic changes<br/>• New handlers needed"]
        end

        subgraph FORMINPUT["FormInput.tsx"]
            FI["Changes when:<br/>• Input styling changes<br/>• Input behavior changes"]
        end

        subgraph REGISTERFORM["RegisterForm.tsx"]
            RF["Changes when:<br/>• Form layout changes<br/>• New fields added"]
        end
    end
```

**Comparison:**

| File | Responsibility | Lines | Reason to Change |
|------|----------------|-------|------------------|
| `types.ts` | Type definitions | ~30 | Data structure changes |
| `validation.ts` | Validation rules | ~50 | Business rules change |
| `useRegisterForm.ts` | State management | ~50 | Form logic changes |
| `FormInput.tsx` | Input UI | ~40 | UI styling changes |
| `RegisterForm.tsx` | Composition | ~50 | Form layout changes |

**Benefit:** Change validation rules? Only touch `validation.ts`. Change input styling? Only touch `FormInput.tsx`.

---

### O - Open/Closed Principle

**Open for extension, closed for modification.**

```mermaid
flowchart LR
    subgraph OCP["Open/Closed Principle"]
        direction TB

        subgraph ORIGINAL["Original"]
            FI1["FormInput<br/>─────────────<br/>text, email, password"]
        end

        subgraph EXTENDED["Extended (No Modification)"]
            FI2["FormInput<br/>─────────────<br/>+ textarea support<br/>+ select support"]
        end

        ORIGINAL -->|"Add prop"| EXTENDED
    end
```

**Example: Adding Textarea Support**

```typescript
// FormInput.tsx - BEFORE (closed for modification)
export interface FormInputProps {
  type?: 'text' | 'email' | 'password';
  // ...
}

// FormInput.tsx - AFTER (extended, not modified)
export interface FormInputProps {
  type?: 'text' | 'email' | 'password' | 'textarea';
  // ...
}

// Component handles new type without breaking existing usage
{type === 'textarea' ? (
  <textarea {...props} />
) : (
  <input type={type} {...props} />
)}
```

---

### L - Liskov Substitution Principle

**Subtypes must be substitutable for their base types.**

```mermaid
flowchart TB
    subgraph LSP["Liskov Substitution Principle"]
        direction TB

        subgraph BASE["Base Input Props"]
            BP["name, value, onChange, onBlur"]
        end

        subgraph DERIVED["FormInputProps (Extended)"]
            DP["+ label, error, disabled, type"]
        end

        subgraph USAGE["Usage"]
            U["Any FormInput can be used<br/>where basic input props expected"]
        end

        BASE --> DERIVED --> USAGE
    end
```

**In Our Code:**

```typescript
// FormInputProps extends standard input behavior
interface FormInputProps {
  // Standard input props (LSP compliant)
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;

  // Extended props
  label: string;
  error?: string;
}

// FormInput behaves like a standard input + extra features
// Can be used anywhere a standard input is expected
```

---

### I - Interface Segregation Principle

**Clients should not depend on interfaces they don't use.**

```mermaid
flowchart TB
    subgraph ISP["Interface Segregation Principle"]
        direction TB

        subgraph BAD["❌ Fat Interface"]
            FAT["FormProps<br/>─────────────<br/>onSubmit<br/>loading<br/>error<br/>initialData<br/>onCancel<br/>submitLabel<br/>..."]
        end

        subgraph GOOD["✅ Segregated Interfaces"]
            direction LR
            SUBMIT["SubmitProps<br/>─────────────<br/>onSubmit<br/>loading"]
            ERROR["ErrorProps<br/>─────────────<br/>error"]
            INPUT["InputProps<br/>─────────────<br/>value<br/>onChange"]
        end
    end
```

**In Our Code:**

```typescript
// ✅ Segregated - FormInput only needs what it uses
interface FormInputProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}

// ✅ Segregated - RegisterForm only needs what it uses
interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;
  loading?: boolean;
  error?: string | null;
}

// Each interface is focused on its specific need
```

---

### D - Dependency Inversion Principle

**Depend on abstractions, not concretions.**

```mermaid
flowchart TB
    subgraph DIP["Dependency Inversion Principle"]
        direction TB

        subgraph HIGH["High-Level Module"]
            RF["RegisterForm"]
        end

        subgraph ABSTRACTION["Abstraction (Interface)"]
            CB["onSubmit: (data) => void"]
        end

        subgraph LOW["Low-Level Modules"]
            direction LR
            API["API Call"]
            REDUX["Redux Dispatch"]
            MOCK["Mock for Testing"]
        end

        RF -->|"depends on"| CB
        CB -->|"implemented by"| API
        CB -->|"implemented by"| REDUX
        CB -->|"implemented by"| MOCK
    end
```

**In Our Code:**

```typescript
// RegisterForm depends on abstraction (callback interface)
interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;  // Abstraction
}

// Parent provides concrete implementation
// Option 1: API call
<RegisterForm onSubmit={(data) => api.register(data)} />

// Option 2: Redux dispatch
<RegisterForm onSubmit={(data) => dispatch(register(data))} />

// Option 3: Mock for testing
<RegisterForm onSubmit={(data) => console.log(data)} />
```

**Benefit:** RegisterForm doesn't know or care HOW data is submitted. It just calls `onSubmit`.

---

## Design Patterns Applied

### 1. Container/Presentational Pattern

```mermaid
flowchart TB
    subgraph PATTERN["Container/Presentational Pattern"]
        direction TB

        subgraph CONTAINER["Container (Logic)"]
            C["useRegisterForm<br/>─────────────<br/>• State management<br/>• Event handlers<br/>• Validation calls"]
        end

        subgraph PRESENTATIONAL["Presentational (UI)"]
            direction LR
            P1["FormInput<br/>─────────────<br/>• Renders input<br/>• Shows error<br/>• No logic"]
            P2["RegisterForm<br/>─────────────<br/>• Composes inputs<br/>• Layout only"]
        end

        CONTAINER --> PRESENTATIONAL
    end
```

| Aspect | Container (useRegisterForm) | Presentational (FormInput) |
|--------|----------------------------|---------------------------|
| Contains | State, Logic | JSX, Styles |
| Knows about | Business rules | How to render |
| Data source | Creates state | Props only |
| Side effects | Yes (validation) | No |

---

### 2. Custom Hook Pattern

```mermaid
flowchart LR
    subgraph HOOK_PATTERN["Custom Hook Pattern"]
        direction TB

        subgraph INPUT["Hook Input"]
            IN["onSubmit callback"]
        end

        subgraph HOOK["useRegisterForm()"]
            direction TB
            S1["useState(formData)"]
            S2["useState(errors)"]
            S3["useState(touched)"]
            H1["handleChange()"]
            H2["handleBlur()"]
            H3["handleSubmit()"]
        end

        subgraph OUTPUT["Hook Output"]
            OUT["{ formData, errors, touched,<br/>handleChange, handleBlur, handleSubmit }"]
        end

        INPUT --> HOOK --> OUTPUT
    end
```

**Benefits:**
- Encapsulates all stateful logic
- Reusable across components
- Testable in isolation
- Separates concerns

---

### 3. Controlled Component Pattern

```mermaid
flowchart LR
    subgraph CONTROLLED["Controlled Component Pattern"]
        direction TB

        subgraph STATE["React State"]
            S["formData.name = 'J'"]
        end

        subgraph INPUT["Input Element"]
            I["<input value={formData.name} />"]
        end

        subgraph HANDLER["Event Handler"]
            H["handleChange → setFormData"]
        end

        STATE -->|"value"| INPUT
        INPUT -->|"onChange"| HANDLER
        HANDLER -->|"updates"| STATE
    end
```

**Uncontrolled vs Controlled:**

| Aspect | Uncontrolled | Controlled (Our Approach) |
|--------|--------------|--------------------------|
| Data source | DOM | React state |
| Get value | `ref.current.value` | `formData.name` |
| Validation | On submit only | On change/blur |
| Predictability | Low | High |

---

### 4. Composition Pattern

```mermaid
flowchart TB
    subgraph COMPOSITION["Composition Pattern"]
        direction TB

        subgraph PARENT["RegisterForm (Composer)"]
            RF["Composes children<br/>Passes props down"]
        end

        subgraph CHILDREN["Composed Components"]
            direction LR
            C1["FormInput (name)"]
            C2["FormInput (email)"]
            C3["FormInput (password)"]
        end

        subgraph REUSE["Reusability"]
            R["Same FormInput<br/>Different props"]
        end

        PARENT --> CHILDREN
        CHILDREN --> REUSE
    end
```

**In Our Code:**

```tsx
// RegisterForm COMPOSES multiple FormInputs
<form onSubmit={handleSubmit}>
  <FormInput name="name" label="Name" {...} />
  <FormInput name="email" label="Email" type="email" {...} />
  <FormInput name="password" label="Password" type="password" {...} />
</form>

// vs Inheritance (not used)
class NameInput extends FormInput {}
class EmailInput extends FormInput {}
```

---

### 5. Props Drilling vs Context (Trade-off)

```mermaid
flowchart TB
    subgraph COMPARISON["Props Drilling vs Context"]
        direction LR

        subgraph DRILLING["Props Drilling (Our Approach)"]
            direction TB
            D1["RegisterForm"]
            D2["FormInput"]
            D1 -->|"value, onChange, error"| D2
        end

        subgraph CONTEXT["Context (Alternative)"]
            direction TB
            C1["FormContext.Provider"]
            C2["FormInput"]
            C3["useFormContext()"]
            C1 --> C2
            C2 --> C3
        end
    end
```

**Why Props Drilling for This Case:**
- Only 1 level deep (RegisterForm → FormInput)
- Explicit data flow (easy to trace)
- No unnecessary complexity
- Context would be overkill

**When to use Context:**
- Deep nesting (3+ levels)
- Many components need same data
- Avoid prop drilling through intermediary components

---

## Pattern Summary

| Pattern | Where Applied | Purpose |
|---------|---------------|---------|
| Single Responsibility | All files | One reason to change per file |
| Open/Closed | FormInput | Extensible without modification |
| Dependency Inversion | onSubmit prop | Depend on abstraction |
| Container/Presentational | Hook + Components | Separate logic from UI |
| Custom Hook | useRegisterForm | Encapsulate state logic |
| Controlled Component | FormInput | React controls input value |
| Composition | RegisterForm | Build from smaller pieces |

---

## Anti-Patterns Avoided

### 1. God Component (Avoided)

```mermaid
flowchart LR
    subgraph AVOIDED["❌ God Component (Avoided)"]
        GOD["RegisterForm.tsx<br/>─────────────<br/>180+ lines<br/>Types + Validation +<br/>State + Handlers + UI"]
    end

    subgraph APPLIED["✅ Separated (Applied)"]
        direction TB
        A1["types.ts"]
        A2["validation.ts"]
        A3["useRegisterForm.ts"]
        A4["FormInput.tsx"]
        A5["RegisterForm.tsx"]
    end

    GOD -->|"Refactored"| APPLIED
```

### 2. Prop Mutation (Avoided)

```typescript
// ❌ Bad: Mutating props
const handleChange = (e) => {
  props.formData.name = e.target.value;  // NEVER DO THIS
};

// ✅ Good: Immutable update
const handleChange = (e) => {
  setFormData(prev => ({ ...prev, [name]: value }));
};
```

### 3. Business Logic in UI (Avoided)

```typescript
// ❌ Bad: Validation in JSX
<input
  onChange={(e) => {
    if (e.target.value.length < 8) {
      setError('Too short');
    }
  }}
/>

// ✅ Good: Validation in separate function
// validation.ts
export const validateField = (name, value) => {
  if (name === 'password' && value.length < 8) {
    return 'Password must be at least 8 characters';
  }
};
```
