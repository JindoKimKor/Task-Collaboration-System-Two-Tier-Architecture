// ============================================
// Form Types (Task #8)
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
// Auth State Types (Task #9)
// ============================================

/**
 * User - 로그인 성공 후 화면에 표시할 사용자 정보
 *
 * Client 활용:
 * - Header에 "Welcome, {name}" 표시
 * - role로 Admin 전용 메뉴/페이지 접근 여부 결정
 * - 프로필 페이지에서 사용자 정보 표시
 */
export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: "Admin" | "User";
}

/**
 * AuthState - 앱 전체에서 인증 상태를 추적하는 Redux 상태
 *
 * Client 활용:
 * - user: 현재 로그인한 사용자 정보 표시
 * - token: axios interceptor가 매 요청마다 Authorization 헤더에 첨부
 * - isAuthenticated: Route guard에서 로그인 페이지 vs 대시보드 결정
 * - loading: 버튼 비활성화, 스피너 표시
 * - error: "Email already exists" 같은 서버 에러를 UI에 표시
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * AuthResponse - 서버가 로그인/회원가입 성공 시 반환하는 응답
 *
 * Client 활용:
 * - token: localStorage에 저장 → 새로고침 후에도 로그인 유지
 * - user: Redux store에 저장 → UI에서 사용자 정보 즉시 표시
 * - expiresIn: 토큰 만료 시간 계산 → 만료 전 자동 갱신 (Story 1.4)
 * - refreshToken: 토큰 갱신 시 사용 (Story 1.4)
 */
export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

/**
 * LoginCredentials - 로그인 폼에서 서버로 보낼 데이터
 *
 * Client 활용:
 * - LoginForm에서 수집한 username/password를 이 형태로 구성
 * - authService.login()에 전달하여 POST /api/auth/login 호출
 * (Story 1.2에서 구현 예정)
 */
export interface LoginCredentials {
  username: string;
  password: string;
}
