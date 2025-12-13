# Code Reuse Analysis

## Overview

Task #15에서는 Task #8 (RegisterForm)의 패턴과 컴포넌트를 재사용하여 LoginForm을 구현했습니다.

---

## Reuse Categories

### 1. Complete Reuse (100%)

**FormInput.tsx** - 코드 변경 없이 그대로 재사용

```typescript
// RegisterForm.tsx
<FormInput
  name="email"
  label="Email"
  type="email"
  value={formData.email}
  error={showError("email")}
  ...
/>

// LoginForm.tsx - 동일한 방식으로 사용
<FormInput
  name="usernameOrEmail"
  label="Username or Email"
  value={formData.usernameOrEmail}
  error={showError("usernameOrEmail")}
  ...
/>
```

**Why Reusable:**
- Props 기반 설계 (name, label, type, value, error, onChange, onBlur)
- 특정 폼에 종속되지 않는 범용 컴포넌트
- Presentational Component 패턴

---

### 2. Pattern Reuse (구조 동일, 내용 다름)

#### useLoginForm.ts vs useRegisterForm.ts

**동일한 구조:**
```typescript
export const useLoginForm = (onSubmit: (data: LoginFormData) => void) => {
  const [formData, setFormData] = useState<LoginFormData>({...});
  const [errors, setErrors] = useState<LoginValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (e) => {...};
  const handleBlur = (e) => {...};
  const handleSubmit = (e) => {...};

  return { formData, errors, touched, handleChange, handleBlur, handleSubmit };
};
```

**다른 점:**

| Aspect | useRegisterForm | useLoginForm |
|--------|-----------------|--------------|
| 타입 | RegisterFormData | LoginFormData |
| 초기값 | name, email, username, password, confirmPassword | usernameOrEmail, password |
| 검증 | validateField, validateForm | validateLoginField, validateLoginForm |
| touched 필드 | 5개 | 2개 |

---

#### LoginForm.tsx vs RegisterForm.tsx

**동일한 구조:**
```typescript
export const LoginForm = ({ onSubmit, loading, error }: LoginFormProps) => {
  const { formData, errors, touched, handleChange, handleBlur, handleSubmit } =
    useLoginForm(onSubmit);

  const showError = (field) => touched[field] ? errors[field] : undefined;

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-box">{error}</div>}
      <FormInput ... />
      <FormInput ... />
      <button type="submit">...</button>
    </form>
  );
};
```

**다른 점:**

| Aspect | RegisterForm | LoginForm |
|--------|--------------|-----------|
| 훅 | useRegisterForm | useLoginForm |
| 필드 수 | 5개 | 2개 |
| 버튼 텍스트 | "Register" / "Registering..." | "Sign In" / "Signing in..." |
| 서버 에러 예시 | "Email already exists" | "Invalid credentials" |

---

#### login.validation.ts vs register.validation.ts

**동일한 패턴:**
```typescript
// 단일 필드 검증
export const validateLoginField = (
  name: keyof LoginFormData,
  value: string
): string | undefined => {
  switch (name) {
    case "usernameOrEmail":
      if (!value.trim()) return "Username or email is required";
      return undefined;
    // ...
  }
};

// 전체 폼 검증
export const validateLoginForm = (data: LoginFormData): LoginValidationErrors => {
  const errors: LoginValidationErrors = {};
  // 각 필드 검증
  return errors;
};
```

**다른 점:**

| Aspect | register.validation | login.validation |
|--------|---------------------|------------------|
| 필드 수 | 5개 | 2개 |
| password 규칙 | min 8자, 필수 | 필수만 |
| 이유 | 새 계정이므로 엄격 | 기존 계정이므로 서버 검증 |

---

## DRY vs WET Trade-off

### Why Not Abstract Further?

**Option A: Generic useForm hook**
```typescript
// 이렇게 추상화할 수도 있지만...
const useForm = <T>(initialData: T, validate: (data: T) => Errors) => {...};
```

**우리가 선택한 방식: Separate hooks**
```typescript
// 각 폼마다 별도 훅
const useRegisterForm = (onSubmit) => {...};
const useLoginForm = (onSubmit) => {...};
```

**이유:**
1. **명확성** - 파일명만 보고 용도 파악
2. **유연성** - 각 폼의 특수 로직 추가 용이
3. **YAGNI** - 현재 2개 폼만 있음, 과도한 추상화 불필요
4. **복잡성** - Generic hook은 타입이 복잡해짐

---

## Code Metrics

### Lines of Code

| File | RegisterForm | LoginForm | Reuse % |
|------|-------------|-----------|---------|
| Form Component | ~140 lines | ~100 lines | 구조 70% |
| Hook | ~130 lines | ~100 lines | 구조 75% |
| Validation | ~60 lines | ~30 lines | 구조 80% |
| Types | 기존 | +30 lines 추가 | - |

### Import Statement Changes

**7개 파일**의 import 경로 업데이트:
- RegisterForm.tsx
- RegisterPage.tsx
- FormInput.tsx
- useRegisterForm.ts
- authSlice.ts
- authService.ts
- index.ts (exports)

---

## Benefits of This Approach

### 1. Consistency
- 두 폼이 동일한 패턴 → 학습 곡선 낮음
- 스타일이 동일 → UI 일관성

### 2. Maintainability
- FormInput 스타일 변경 → 모든 폼에 적용
- 검증 로직은 분리 → 독립적 수정

### 3. Scalability
- 새 폼 추가 시 → 동일 패턴 복사
- PasswordResetForm, ProfileForm 등 확장 용이

---

## Anti-patterns Avoided

### 1. Copy-Paste Programming ❌
```typescript
// BAD: 코드 복사
const LoginForm = () => {
  // RegisterForm에서 복사한 100줄의 코드
};
```

### 2. Over-Abstraction ❌
```typescript
// BAD: 과도한 추상화
const useForm = <T, E, V>(config: FormConfig<T, E, V>) => {...};
// 사용하기 복잡, 타입 추론 어려움
```

### 3. God Component ❌
```typescript
// BAD: 모든 폼을 하나의 컴포넌트로
const AuthForm = ({ mode }: { mode: 'login' | 'register' }) => {
  // if (mode === 'login') ... else ...
  // 복잡하고 유지보수 어려움
};
```

---

## Summary

| 재사용 유형 | 파일 | 설명 |
|------------|------|------|
| **Complete** | FormInput.tsx | 100% 재사용 |
| **Pattern** | useLoginForm.ts | 구조 재사용, 필드 다름 |
| **Pattern** | LoginForm.tsx | 구조 재사용, 필드 다름 |
| **Pattern** | login.validation.ts | 구조 재사용, 규칙 다름 |
| **Types** | form.types.ts | 기존 타입 + 새 타입 추가 |

**결론:** Component Reuse (FormInput) + Pattern Reuse (구조 복사) 조합이 현재 규모에 적합
