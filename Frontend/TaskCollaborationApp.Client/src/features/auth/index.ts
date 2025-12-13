// ============================================
// Components (Task #8)
// ============================================

/**
 * RegisterForm - 회원가입 폼 UI 컴포넌트
 * Client 활용: RegisterPage에서 렌더링
 */
export { RegisterForm } from "./components/RegisterForm";

/**
 * FormInput - 재사용 가능한 입력 필드 컴포넌트
 * Client 활용: RegisterForm, LoginForm 등에서 사용
 */
export { FormInput } from "./components/FormInput";

// ============================================
// Hooks (Task #8)
// ============================================

/**
 * useRegisterForm - 회원가입 폼 상태 관리 훅
 * Client 활용: RegisterForm 내부에서 사용
 */
export { useRegisterForm } from "./hooks/useRegisterForm";

// ============================================
// Store (Task #9)
// ============================================

/**
 * authReducer - Redux store에 등록할 auth reducer
 * Client 활용: app/store.ts에서 configureStore에 등록
 */
export { default as authReducer } from "./store/authSlice";

/**
 * register - 회원가입 async thunk
 * Client 활용: RegisterPage에서 dispatch(register(formData))
 */
export { register } from "./store/authSlice";

/**
 * logout - 로그아웃 액션
 * Client 활용: Header에서 dispatch(logout())
 */
export { logout } from "./store/authSlice";

/**
 * clearError - 에러 메시지 초기화 액션
 * Client 활용: 폼 수정 시작할 때 또는 에러 닫기 버튼 클릭 시
 */
export { clearError } from "./store/authSlice";

// ============================================
// Services (Task #9)
// ============================================

/**
 * authService - Auth API 호출 서비스
 * Client 활용: 주로 authSlice thunk에서 사용, 직접 호출도 가능
 */
export { authService } from "./services/authService";

// ============================================
// Types (Task #8 + Task #9)
// ============================================

export type {
  // Task #8: Form types
  RegisterFormData,
  RegisterFormProps,
  ValidationErrors,
  FormInputProps,
  // Task #9: Auth state types
  User,
  AuthState,
  AuthResponse,
  LoginCredentials,
} from "./types";
