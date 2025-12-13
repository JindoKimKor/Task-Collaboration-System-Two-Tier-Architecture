# Design Patterns & SOLID (GoF-based)

## GoF Design Patterns Used

### 1. Strategy Pattern

**GoF Definition:** Define a family of algorithms, encapsulate each one, and make them interchangeable.

**우리 코드에서:**
```
Validation 함수들이 Strategy 역할
- register.validation.ts → RegisterForm의 검증 전략
- login.validation.ts → LoginForm의 검증 전략
```

**Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ Context (useRegisterForm / useLoginForm)                    │
│                                                             │
│   ┌─────────────────────┐    ┌─────────────────────┐       │
│   │ Strategy Interface  │    │ Strategy Interface  │       │
│   │ validateField()     │    │ validateLoginField()│       │
│   │ validateForm()      │    │ validateLoginForm() │       │
│   └─────────────────────┘    └─────────────────────┘       │
│            ▲                          ▲                     │
│            │                          │                     │
│   ┌────────┴────────┐       ┌────────┴────────┐            │
│   │ register.       │       │ login.          │            │
│   │ validation.ts   │       │ validation.ts   │            │
│   └─────────────────┘       └─────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- 검증 로직을 독립적으로 변경 가능
- 새 폼 추가 시 새 validation 파일만 생성
- 테스트 시 mock validation 주입 가능

---

### 2. Template Method Pattern

**GoF Definition:** Define the skeleton of an algorithm in an operation, deferring some steps to subclasses.

**우리 코드에서:**
```
useRegisterForm과 useLoginForm이 동일한 알고리즘 골격 공유
- 상태 초기화 (formData, errors, touched)
- handleChange, handleBlur, handleSubmit 구조
- 세부 구현만 다름 (필드, 검증 규칙)
```

**Algorithm Skeleton:**
```
1. Initialize state (formData, errors, touched)
2. handleChange → update formData, clear error
3. handleBlur → set touched, validate single field
4. handleSubmit → validate all, call onSubmit if valid
```

**Comparison:**
```
┌──────────────────────────────────────────────────────────────┐
│              Template Method (Abstract)                       │
├──────────────────────────────────────────────────────────────┤
│ 1. useState(initialFormData)      ← Hook이 정의              │
│ 2. useState({})                   ← errors                   │
│ 3. useState({})                   ← touched                  │
│ 4. handleChange(e)                ← 동일한 로직              │
│ 5. handleBlur(e) → validate()     ← validate만 다름          │
│ 6. handleSubmit(e) → validateAll()← validateAll만 다름       │
└──────────────────────────────────────────────────────────────┘
         │                                   │
         ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│ useRegisterForm     │           │ useLoginForm        │
├─────────────────────┤           ├─────────────────────┤
│ initialData: 5 fields│          │ initialData: 2 fields│
│ validate: register   │          │ validate: login      │
│ validateAll: register│          │ validateAll: login   │
└─────────────────────┘           └─────────────────────┘
```

---

### 3. Composite Pattern (Component Tree)

**GoF Definition:** Compose objects into tree structures to represent part-whole hierarchies.

**우리 코드에서:**
```
React 컴포넌트 트리 자체가 Composite 패턴
- LoginForm (Composite) = FormInput들 + Button의 조합
- FormInput (Leaf) = 더 이상 분해되지 않는 단위
```

**Structure:**
```
LoginForm (Composite)
├── error div (Leaf)
├── FormInput (Leaf) - usernameOrEmail
├── FormInput (Leaf) - password
└── button (Leaf)
```

**Uniform Interface:**
```typescript
// 모든 컴포넌트가 동일한 인터페이스 (props → JSX)
interface Component {
  (props: Props): JSX.Element;
}
```

---

### 4. Observer Pattern (React's One-Way Data Flow)

**GoF Definition:** Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified.

**우리 코드에서:**
```
useState가 Observer 패턴 구현
- State 변경 → React가 구독자(컴포넌트)에게 알림 → 리렌더
```

**Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│ useLoginForm (Subject/Observable)                           │
│                                                             │
│   formData state ─────┐                                     │
│   errors state ───────┼──→ LoginForm (Observer)            │
│   touched state ──────┘        │                           │
│                                ▼                            │
│                          FormInput (Observer)               │
│                          FormInput (Observer)               │
└─────────────────────────────────────────────────────────────┘

State Change → Notify → Re-render
```

---

## SOLID Principles Applied

### S - Single Responsibility Principle

**Definition:** A class/module should have only one reason to change.

**적용:**
| File | Single Responsibility | Changes When |
|------|----------------------|--------------|
| form.types.ts | 타입 정의 | 필드 추가/변경 |
| login.validation.ts | 로그인 검증 규칙 | 검증 규칙 변경 |
| useLoginForm.ts | 폼 상태 관리 | 상태 로직 변경 |
| LoginForm.tsx | 폼 UI 구성 | 레이아웃 변경 |
| FormInput.tsx | 입력 필드 UI | 입력 스타일 변경 |

**Before Refactoring (SRP 위반):**
```
types.ts (모든 타입) → 여러 이유로 변경됨
validation.ts (모든 검증) → 여러 이유로 변경됨
```

**After Refactoring (SRP 준수):**
```
types/form.types.ts → 폼 타입만
types/state.types.ts → 상태 타입만
types/api.types.ts → API 타입만
validation/register.validation.ts → 회원가입 검증만
validation/login.validation.ts → 로그인 검증만
```

---

### O - Open/Closed Principle

**Definition:** Software entities should be open for extension, but closed for modification.

**적용:**
```
FormInput은 수정 없이 확장 가능
- 새 폼 추가 시 FormInput 코드 변경 없음
- Props만 다르게 전달하면 다양한 용도로 사용
```

**Example:**
```typescript
// FormInput.tsx는 변경 없음, 사용 방식만 확장
<FormInput name="usernameOrEmail" label="Username or Email" />
<FormInput name="phone" label="Phone Number" type="tel" />
<FormInput name="address" label="Address" />
```

---

### L - Liskov Substitution Principle

**Definition:** Objects of a superclass should be replaceable with objects of its subclasses without breaking the application.

**적용:**
```
모든 Form 컴포넌트가 동일한 Props 구조를 따름
→ FormProps를 받는 곳에 어떤 Form이든 사용 가능
```

**Example:**
```typescript
interface FormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  error?: string | null;
}

// 둘 다 FormProps를 만족
<RegisterForm onSubmit={handleRegister} loading={loading} error={error} />
<LoginForm onSubmit={handleLogin} loading={loading} error={error} />
```

---

### I - Interface Segregation Principle

**Definition:** Clients should not be forced to depend on interfaces they do not use.

**적용:**
```
타입을 세분화하여 필요한 것만 import
```

**Before:**
```typescript
// 모든 타입을 한 파일에서 import
import { RegisterFormData, LoginFormData, User, AuthState, AuthResponse } from "../types";
```

**After:**
```typescript
// 필요한 타입만 해당 파일에서 import
import type { LoginFormData } from "../types/form.types";
// User, AuthState 등은 import하지 않음
```

---

### D - Dependency Inversion Principle

**Definition:** High-level modules should not depend on low-level modules. Both should depend on abstractions.

**적용:**
```
LoginForm은 구체적인 검증 구현에 의존하지 않음
→ useLoginForm 훅이 추상화 역할
→ 검증 로직은 훅 내부에서 처리
```

**Dependency Direction:**
```
High Level                    Low Level
─────────────────────────────────────────
LoginForm
    │
    ▼
useLoginForm (Abstraction)
    │
    ▼
login.validation.ts
```

**LoginForm은 검증 로직을 직접 알지 못함:**
```typescript
// LoginForm.tsx - 검증 로직 없음
const { formData, errors, handleSubmit } = useLoginForm(onSubmit);
// handleSubmit 내부에서 어떻게 검증하는지 모름
```

---

## Pattern Comparison: GoF vs React Patterns

| GoF Pattern | React Equivalent | Our Code |
|-------------|------------------|----------|
| Strategy | Custom Hooks + Functions | validation files |
| Template Method | Hook Pattern | useRegisterForm/useLoginForm |
| Composite | Component Tree | LoginForm + FormInputs |
| Observer | useState/useEffect | State → Re-render |
| Factory | Component Functions | FormInput factory |

---

## Summary

**GoF Patterns:**
1. **Strategy** - 검증 로직을 교체 가능한 함수로 분리
2. **Template Method** - 훅의 알고리즘 골격 공유
3. **Composite** - 컴포넌트 트리 구조
4. **Observer** - 상태 변경 → 리렌더링

**SOLID:**
1. **SRP** - 파일을 책임별로 분리 (types/, validation/)
2. **OCP** - FormInput은 수정 없이 확장
3. **LSP** - 모든 Form이 동일한 Props 구조
4. **ISP** - 필요한 타입만 import
5. **DIP** - Form → Hook → Validation 방향으로 의존
