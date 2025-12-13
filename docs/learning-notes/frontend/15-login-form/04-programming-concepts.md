# Programming Concepts (Language Agnostic)

## 1. Module System & Namespace Organization

### Concept
코드를 논리적 단위로 분리하여 관리하는 방식. 대부분의 현대 언어에서 지원.

### Language Implementations

| Language | Module System | Our Example |
|----------|---------------|-------------|
| TypeScript/JS | ES Modules (import/export) | `types/form.types.ts` |
| Python | Packages (__init__.py) | `types/__init__.py` |
| Java | Packages (com.example.types) | `com.example.types.FormTypes` |
| C# | Namespaces | `namespace Auth.Types` |
| Go | Packages | `package types` |

### Our Implementation
```
types/
├── form.types.ts    → Form 관련 타입
├── state.types.ts   → State 관련 타입
└── api.types.ts     → API 관련 타입
```

### Key Principle: Cohesion
**높은 응집도** - 관련된 것들을 함께 묶음
- form.types.ts: 폼과 관련된 모든 타입
- api.types.ts: API와 관련된 모든 타입

---

## 2. Module Resolution

### Concept
import 경로를 실제 파일로 매핑하는 과정.

### Resolution Algorithm (Common Pattern)
```
import X from "./types"

1. ./types.ts 파일 존재? → 사용
2. ./types/index.ts 존재? → 사용
3. ./types/index.js 존재? → 사용
4. 없으면 에러
```

### Language Variations

**Node.js/TypeScript:**
```typescript
import { LoginFormData } from "../types/form.types";
// → ../types/form.types.ts 또는 ../types/form.types/index.ts
```

**Python:**
```python
from types.form_types import LoginFormData
# → types/form_types.py 또는 types/form_types/__init__.py
```

**Java:**
```java
import com.example.types.FormTypes;
// → com/example/types/FormTypes.java (클래스 파일)
```

### Our Decision: No index.ts in types/
```
types/
├── form.types.ts    ✓ 직접 import
├── state.types.ts   ✓ 직접 import
└── index.ts         ✗ 없음 (중복 export 방지)
```

---

## 3. Barrel Export Pattern

### Concept
여러 모듈을 하나의 진입점에서 re-export하여 외부에 공개하는 패턴.

### Implementation
```
auth/
├── types/
│   └── form.types.ts   (internal)
├── components/
│   └── LoginForm.tsx   (internal)
└── index.ts            (public API - barrel)
```

**index.ts (Barrel):**
```typescript
// Public API 정의
export { LoginForm } from "./components/LoginForm";
export type { LoginFormData } from "./types/form.types";
```

**External Usage:**
```typescript
// 내부 구조를 몰라도 됨
import { LoginForm, LoginFormData } from "@/features/auth";
```

### Benefits
1. **Encapsulation** - 내부 구조 숨김
2. **Refactoring** - 내부 파일 이동해도 외부 import 불변
3. **Explicit API** - 무엇이 public인지 명확

### Trade-offs
- Tree-shaking 문제 가능 (bundler에 따라)
- 순환 참조 주의 필요

---

## 4. Pure Functions

### Concept
동일한 입력에 항상 동일한 출력을 반환하고, 부작용(side effect)이 없는 함수.

### Characteristics
```
Pure Function:
✓ 같은 입력 → 항상 같은 출력
✓ 외부 상태 변경 없음
✓ 외부 상태 의존 없음
```

### Our Implementation
```typescript
// Pure Function - 검증
export const validateLoginField = (
  name: keyof LoginFormData,
  value: string
): string | undefined => {
  switch (name) {
    case "usernameOrEmail":
      if (!value.trim()) return "Username or email is required";
      return undefined;
    case "password":
      if (!value) return "Password is required";
      return undefined;
  }
};

// 테스트 용이
test("empty usernameOrEmail returns error", () => {
  expect(validateLoginField("usernameOrEmail", "")).toBe("Username or email is required");
});
```

### Language Examples

**JavaScript/TypeScript:**
```typescript
const add = (a: number, b: number): number => a + b;
```

**Python:**
```python
def add(a: int, b: int) -> int:
    return a + b
```

**Haskell (순수 함수형):**
```haskell
add :: Int -> Int -> Int
add a b = a + b
```

---

## 5. Encapsulation & Information Hiding

### Concept
구현 세부사항을 숨기고 인터페이스만 노출하는 원칙.

### Our Implementation

**Hidden (Internal):**
```
types/form.types.ts      - 직접 import 하지 않음 (외부에서)
validation/login.validation.ts - 직접 import 하지 않음
```

**Exposed (Public API):**
```typescript
// auth/index.ts에서 선택적으로 노출
export { LoginForm } from "./components/LoginForm";
export type { LoginFormData } from "./types/form.types";
// validation 함수는 노출하지 않음 (내부용)
```

### Access Levels Comparison

| Language | Public | Private | Protected |
|----------|--------|---------|-----------|
| TypeScript | export | no export | - |
| Java | public | private | protected |
| Python | no prefix | _prefix | __prefix |
| C# | public | private | protected |

---

## 6. Separation of Concerns (SoC)

### Concept
시스템을 구분된 섹션으로 나누어 각 섹션이 별도의 관심사를 다루도록 함.

### Our Separation

```
┌─────────────────────────────────────────────────────────────┐
│                        Concerns                              │
├─────────────────────────────────────────────────────────────┤
│ Types        │ 데이터 구조 정의                              │
│ Validation   │ 비즈니스 규칙 (검증)                          │
│ State (Hook) │ 상태 관리 로직                                │
│ UI (Component)│ 표현 (렌더링)                                │
│ API Service  │ 외부 통신                                     │
│ Store (Redux)│ 전역 상태                                     │
└─────────────────────────────────────────────────────────────┘
```

### Cross-Cutting Concerns
여러 레이어에 걸쳐 있는 관심사:
- Logging
- Error Handling
- Authentication

---

## 7. Composition over Inheritance

### Concept
상속보다 조합을 선호하여 유연성을 높임.

### Our Implementation
```typescript
// Composition: LoginForm은 useLoginForm + FormInput을 조합
const LoginForm = ({ onSubmit, loading, error }) => {
  const { formData, errors, handleChange } = useLoginForm(onSubmit);  // 조합

  return (
    <form>
      <FormInput {...} />  {/* 조합 */}
      <FormInput {...} />  {/* 조합 */}
    </form>
  );
};
```

### Why Not Inheritance
```typescript
// ❌ Inheritance (안티패턴)
class LoginForm extends BaseForm {
  // 상속 체인이 복잡해짐
}

// ✓ Composition
const LoginForm = () => {
  const formState = useLoginForm();  // 행동을 조합
  return <form>...</form>;
};
```

### Language Examples

**Go (No Inheritance, Only Composition):**
```go
type LoginForm struct {
    FormState FormState  // Composition
    Validator Validator  // Composition
}
```

**Rust (Traits + Composition):**
```rust
struct LoginForm {
    state: FormState,      // Composition
    validator: Box<dyn Validator>, // Composition
}
```

---

## 8. DRY vs WET Trade-off

### DRY (Don't Repeat Yourself)
코드 중복을 피함.

### WET (Write Everything Twice)
때로는 약간의 중복이 더 나음.

### Our Decision
```
FormInput.tsx → DRY (완전 재사용)
useLoginForm.ts → WET (구조는 같지만 별도 파일)
```

**Why WET for Hooks:**
1. 필드가 다름 (2개 vs 5개)
2. 검증 규칙이 다름
3. 과도한 추상화 피함 (Generic useForm은 복잡)

### Rule of Three
"세 번 반복되면 추상화를 고려하라"
- 현재 2개 폼만 있음 → 아직 추상화 불필요

---

## 9. Defensive Programming

### Concept
예상치 못한 입력에 대비하는 프로그래밍.

### Our Implementation
```typescript
// Default 값으로 undefined 방어
export const LoginForm = ({
  onSubmit,
  loading = false,  // undefined면 false
  error,
}: LoginFormProps) => {...};

// Null/Undefined 체크
const showError = (field: keyof LoginValidationErrors) =>
  touched[field] ? errors[field] : undefined;
  // touched[field]가 falsy면 에러 표시 안 함
```

### Guard Clauses
```typescript
const validateLoginField = (name, value) => {
  // Early return으로 방어
  if (!value.trim()) return "Required";
  return undefined;
};
```

---

## 10. Type Safety

### Concept
컴파일 타임에 타입 오류를 잡아 런타임 에러를 방지.

### Our Implementation
```typescript
// 타입 정의
interface LoginFormData {
  usernameOrEmail: string;
  password: string;
}

// 잘못된 필드명 사용 시 컴파일 에러
const data: LoginFormData = {
  username: "test",  // ❌ Error: 'username' does not exist
  password: "123"
};
```

### Type Safety Spectrum

| Level | Language | Our Code |
|-------|----------|----------|
| No Types | JavaScript | - |
| Optional Types | TypeScript (strict: false) | - |
| Strict Types | TypeScript (strict: true) | ✓ 사용 중 |
| Dependent Types | Idris, Agda | - |

---

## Summary

| Concept | What We Did | Benefit |
|---------|-------------|---------|
| Module System | types/, validation/ 폴더 분리 | 코드 조직화 |
| Module Resolution | 직접 파일 import | 명확한 의존성 |
| Barrel Export | auth/index.ts | Public API 명확화 |
| Pure Functions | validation 함수들 | 테스트 용이 |
| Encapsulation | 선택적 export | 내부 구현 숨김 |
| SoC | 레이어별 파일 분리 | 유지보수성 |
| Composition | Hook + Component 조합 | 유연성 |
| DRY/WET | 적절한 균형 | 과도한 추상화 방지 |
| Defensive Programming | 기본값, 타입 체크 | 런타임 에러 방지 |
| Type Safety | TypeScript strict | 컴파일 타임 에러 검출 |
