# LoginForm Architecture Diagram

## Component Hierarchy

```mermaid
flowchart TB
    subgraph FUTURE["Future (Task #16)"]
        LoginPage["LoginPage<br/>─────────────<br/>Container Component<br/>Redux 연결"]
    end

    subgraph TASK15["Task #15 - LoginForm"]
        LoginForm["LoginForm<br/>─────────────<br/>Presentational Component<br/>폼 구성 담당"]
        UseLoginForm["useLoginForm<br/>─────────────<br/>Custom Hook<br/>상태 관리"]
        FormInput["FormInput<br/>─────────────<br/>Reusable Component<br/>(from Task #8)"]
        LoginValidation["login.validation.ts<br/>─────────────<br/>Pure Functions<br/>검증 규칙"]
    end

    subgraph TYPES["Types (Refactored)"]
        FormTypes["form.types.ts<br/>─────────────<br/>LoginFormData<br/>LoginFormProps<br/>LoginValidationErrors"]
    end

    LoginPage --> LoginForm
    LoginForm --> UseLoginForm
    LoginForm --> FormInput
    UseLoginForm --> LoginValidation
    UseLoginForm --> FormTypes
    LoginValidation --> FormTypes
    FormInput --> FormTypes
```

---

## Register vs Login Comparison

```mermaid
flowchart LR
    subgraph REGISTER["RegisterForm (Task #8)"]
        direction TB
        RF["RegisterForm"]
        URF["useRegisterForm"]
        RV["register.validation"]
        RF --> URF --> RV
    end

    subgraph LOGIN["LoginForm (Task #15)"]
        direction TB
        LF["LoginForm"]
        ULF["useLoginForm"]
        LV["login.validation"]
        LF --> ULF --> LV
    end

    subgraph SHARED["Shared Components"]
        FI["FormInput"]
        FT["form.types.ts"]
    end

    RF --> FI
    LF --> FI
    URF --> FT
    ULF --> FT
```

---

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant LoginForm
    participant useLoginForm
    participant validation
    participant LoginPage

    Note over LoginForm: 컴포넌트 마운트
    LoginForm->>useLoginForm: 훅 호출
    useLoginForm-->>LoginForm: { formData, errors, handlers }

    User->>LoginForm: 타이핑 (onChange)
    LoginForm->>useLoginForm: handleChange(e)
    useLoginForm->>useLoginForm: setFormData 업데이트
    useLoginForm-->>LoginForm: 새 formData로 리렌더

    User->>LoginForm: 필드 떠남 (onBlur)
    LoginForm->>useLoginForm: handleBlur(e)
    useLoginForm->>validation: validateLoginField(name, value)
    validation-->>useLoginForm: error | undefined
    useLoginForm->>useLoginForm: setErrors, setTouched
    useLoginForm-->>LoginForm: 에러 표시

    User->>LoginForm: 제출 버튼 클릭
    LoginForm->>useLoginForm: handleSubmit(e)
    useLoginForm->>validation: validateLoginForm(formData)
    validation-->>useLoginForm: errors object

    alt 에러 있음
        useLoginForm-->>LoginForm: 모든 에러 표시
    else 에러 없음
        useLoginForm->>LoginPage: onSubmit(formData)
        Note over LoginPage: Task #16에서<br/>dispatch(login(formData))
    end
```

---

## File Structure After Refactoring

```
src/features/auth/
│
├── types/                          ★ REFACTORED from types.ts
│   ├── form.types.ts               # Form-related types
│   │   ├── RegisterFormData
│   │   ├── RegisterFormProps
│   │   ├── ValidationErrors
│   │   ├── FormInputProps
│   │   ├── LoginFormData           ★ NEW
│   │   ├── LoginFormProps          ★ NEW
│   │   └── LoginValidationErrors   ★ NEW
│   │
│   ├── state.types.ts              # Redux state types
│   │   ├── User
│   │   └── AuthState
│   │
│   └── api.types.ts                # API types
│       ├── AuthResponse
│       └── LoginCredentials
│
├── utils/
│   └── validation/                 ★ REFACTORED from validation.ts
│       ├── register.validation.ts  # validateField, validateForm
│       └── login.validation.ts     # validateLoginField, validateLoginForm ★ NEW
│
├── hooks/
│   ├── useRegisterForm.ts
│   └── useLoginForm.ts             ★ NEW
│
├── components/
│   ├── FormInput.tsx               # Reused (no changes)
│   ├── RegisterForm.tsx
│   └── LoginForm.tsx               ★ NEW
│
├── pages/
│   └── RegisterPage.tsx
│
├── store/
│   └── authSlice.ts
│
├── services/
│   └── authService.ts
│
└── index.ts                        # Updated exports
```

---

## Import Path Changes

### Before (types.ts)
```typescript
import type { RegisterFormData } from "../types";
```

### After (types/ folder)
```typescript
import type { RegisterFormData } from "../types/form.types";
import type { AuthState } from "../types/state.types";
import type { AuthResponse } from "../types/api.types";
```

### Why Direct File Imports
```
auth/
├── types/
│   ├── form.types.ts    ← 직접 import
│   └── index.ts         ← 없음! (중복 export 방지)
└── index.ts             ← 여기서만 외부에 export
```

**External Import (다른 feature에서):**
```typescript
import type { LoginFormData } from "@/features/auth";
// auth/index.ts가 re-export
```

**Internal Import (auth feature 내부에서):**
```typescript
import type { LoginFormData } from "../types/form.types";
// 직접 파일 참조
```
