// ============================================
// Components (Task #9, #15)
// ============================================

/**
 * FormInput - 재사용 가능한 입력 필드 컴포넌트
 * Client 활용: RegisterForm, LoginForm에서 각 필드 렌더링
 */
export { FormInput } from "./components/FormInput";

/**
 * RegisterForm - 회원가입 폼 컴포넌트
 * Client 활용: RegisterPage에서 렌더링
 */
export { RegisterForm } from "./components/RegisterForm";

/**
 * LoginForm - 로그인 폼 컴포넌트
 * Client 활용: LoginPage에서 렌더링
 */
export { LoginForm } from "./components/LoginForm";

// ============================================
// Pages (Task #10, #17)
// ============================================

/**
 * RegisterPage - 회원가입 페이지 (Container)
 * Client 활용: /register 경로에서 렌더링
 */
export { RegisterPage } from "./pages/RegisterPage";

/**
 * LoginPage - 로그인 페이지 (Container)
 * Client 활용: /login 경로에서 렌더링
 */
export { LoginPage } from "./pages/LoginPage";

// ============================================
// Hooks (Task #8)
// ============================================

/**
 * useRegisterForm - 회원가입 폼 상태 관리 훅
 * Client 활용: RegisterForm 내부에서 사용
 */
export { useRegisterForm } from "./hooks/useRegisterForm";

// ============================================
// Store (Task #9, #16, #22)
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
export { register } from "./store/authThunks";

/**
 * login - 로그인 async thunk
 * Client 활용: LoginPage에서 dispatch(login(formData))
 */
export { login } from "./store/authThunks";

/**
 * fetchCurrentUser - 현재 사용자 정보 조회 async thunk
 * Client 활용: App.tsx에서 앱 시작 시 dispatch(fetchCurrentUser())
 */
export { fetchCurrentUser } from "./store/authThunks";

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
// Types (Task #8, #9, #15)
// ============================================

/**
 * Form Types - 폼 관련 타입
 * Client 활용: RegisterForm, LoginForm, FormInput, useRegisterForm, useLoginForm, validation.ts
 */
export type {
  RegisterFormData,
  RegisterFormProps,
  ValidationErrors,
  FormInputProps,
  LoginFormData,
  LoginFormProps,
  LoginValidationErrors,
} from "./types/form.types";

/**
 * State Types - Redux 상태 관련 타입
 * Client 활용: authSlice, useAppSelector
 */
export type { User, AuthState } from "./types/state.types";

/**
 * API Types - API 요청/응답 관련 타입
 * Client 활용: authService, authSlice thunk
 */
export type {
  AuthResponse,
  LoginCredentials,
  UserResponse,
} from "./types/api.types";
