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
