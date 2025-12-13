import api from "../../../services/api";
import type { RegisterFormData } from "../types/form.types";
import type { AuthResponse } from "../types/api.types";

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

  // login은 Story 1.2에서 구현 예정
};
