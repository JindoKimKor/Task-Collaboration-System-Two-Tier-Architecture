import api from "../../../services/api";
import type { RegisterFormData, LoginFormData } from "../types/form.types";
import type { AuthResponse, UserResponse } from "../types/api.types";

/**
 * authService - Auth 관련 API 호출을 담당
 *
 * Client 활용:
 * - authSlice의 createAsyncThunk에서 호출
 * - 실제 HTTP 요청을 보내고 응답을 반환
 * - 에러 처리는 호출하는 쪽(thunk)에서 담당
 */
export const authService = {
  /**
   * register - 회원가입 API 호출
   *
   * Client 활용:
   * - RegisterPage에서 폼 제출 시 dispatch(register(formData)) 호출
   * - thunk가 이 함수를 호출하여 서버에 요청
   * - 성공 시 AuthResponse 반환 → thunk가 Redux store 업데이트
   *
   * Note: confirmPassword는 프론트엔드 검증용이므로 서버에 보내지 않음
   */
  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", {
      name: data.name,
      email: data.email,
      username: data.username,
      password: data.password,
      // confirmPassword는 보내지 않음
    });
    return response.data;
  },

  /**
   * login - 로그인 API 호출
   *
   * Client 활용:
   * - LoginPage에서 폼 제출 시 dispatch(login(formData)) 호출
   * - thunk가 이 함수를 호출하여 서버에 요청
   * - 성공 시 AuthResponse 반환 → thunk가 Redux store 업데이트
   */
  login: async (data: LoginFormData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", {
      usernameOrEmail: data.usernameOrEmail,
      password: data.password,
    });
    return response.data;
  },

  /**
   * fetchCurrentUser - 현재 로그인된 사용자 정보 조회
   *
   * Client 활용:
   * - 앱 시작 시 localStorage에 token이 있으면 호출
   * - dispatch(fetchCurrentUser()) → 이 함수 호출 → Redux store 업데이트
   *
   * 토큰 전송:
   * - api.ts의 interceptor가 localStorage의 token을 자동으로 헤더에 첨부
   * - 별도로 token을 파라미터로 받을 필요 없음
   *
   * 에러 처리:
   * - 401 Unauthorized: 토큰 만료/무효 → thunk에서 localStorage 클리어
   */
  fetchCurrentUser: async (): Promise<UserResponse> => {
    const response = await api.get<UserResponse>("/auth/me");
    return response.data;
  },

  /**
   * googleLogin - Google OAuth 로그인 API 호출
   *
   * Client 활용:
   * - GoogleSignInButton에서 Google 로그인 성공 시 호출
   * - dispatch(googleLogin(idToken)) → 이 함수 호출 → Redux store 업데이트
   *
   * @param idToken - Google에서 받은 ID Token (credential)
   */
  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/google", {
      idToken,
    });
    return response.data;
  },
};
