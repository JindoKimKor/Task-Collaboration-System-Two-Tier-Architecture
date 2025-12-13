// ============================================
// Register Form Types (Task #8)
// ============================================

/**
 * RegisterFormData - 회원가입 폼에서 수집하는 입력값
 *
 * Client 활용:
 * - useRegisterForm 훅에서 useState로 관리
 * - 각 input의 value로 바인딩
 * - submit 시 API로 전송 (confirmPassword 제외)
 *
 * Note: confirmPassword는 프론트엔드 검증용으로만 사용, 서버에는 보내지 않음
 */
export interface RegisterFormData {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

/**
 * RegisterFormProps - RegisterForm 컴포넌트가 부모로부터 받는 Props
 *
 * Client 활용:
 * - onSubmit: 폼 제출 시 부모(RegisterPage)가 Redux dispatch 실행
 * - loading: true면 버튼 비활성화 + "Registering..." 텍스트 표시
 * - error: 서버 에러 메시지를 폼 상단에 빨간색으로 표시
 */
export interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * ValidationErrors - 각 필드별 클라이언트 유효성 검사 에러 메시지
 *
 * Client 활용:
 * - validateField() 함수가 반환
 * - FormInput의 error prop으로 전달되어 필드 아래 빨간 텍스트로 표시
 * - undefined면 에러 없음, string이면 해당 메시지 표시
 */
export interface ValidationErrors {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * FormInputProps - FormInput 컴포넌트가 받는 Props
 *
 * Client 활용:
 * - name: input의 name 속성, handleChange에서 어떤 필드인지 식별
 * - label: 입력 필드 위에 표시되는 레이블 텍스트
 * - value: 현재 입력값 (controlled component)
 * - error: 유효성 에러 메시지 (있으면 빨간색 테두리 + 메시지 표시)
 * - disabled: loading 중일 때 입력 비활성화
 * - onChange/onBlur: 부모의 핸들러를 그대로 전달받아 실행
 */
export interface FormInputProps {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}

// ============================================
// Login Form Types (Task #15)
// ============================================

/**
 * LoginFormData - 로그인 폼에서 수집하는 입력값
 *
 * Client 활용:
 * - useLoginForm 훅에서 useState로 관리
 * - 각 input의 value로 바인딩
 * - submit 시 API로 전송
 */
export interface LoginFormData {
  usernameOrEmail: string;
  password: string;
}

/**
 * LoginFormProps - LoginForm 컴포넌트가 부모로부터 받는 Props
 *
 * Client 활용:
 * - onSubmit: 폼 제출 시 부모(LoginPage)가 Redux dispatch 실행
 * - loading: true면 버튼 비활성화 + "Logging in..." 텍스트 표시
 * - error: 서버 에러 메시지를 폼 상단에 빨간색으로 표시
 */
export interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * LoginValidationErrors - 로그인 폼 필드별 유효성 검사 에러 메시지
 *
 * Client 활용:
 * - validateLoginField() 함수가 반환
 * - FormInput의 error prop으로 전달
 */
export interface LoginValidationErrors {
  usernameOrEmail?: string;
  password?: string;
}
