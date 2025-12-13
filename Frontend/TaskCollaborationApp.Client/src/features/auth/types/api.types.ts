import type { User } from "./state.types";

// ============================================
// API Types (Task #9)
// ============================================

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
 * - LoginForm에서 수집한 usernameOrEmail/password를 이 형태로 구성
 * - authService.login()에 전달하여 POST /api/auth/login 호출
 */
export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}
