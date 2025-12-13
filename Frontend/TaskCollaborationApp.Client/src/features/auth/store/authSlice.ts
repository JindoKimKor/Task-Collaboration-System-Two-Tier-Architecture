import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../services/authService";
import type { AuthState } from "../types/state.types";
import type { RegisterFormData } from "../types/form.types";

/**
 * initialState - 앱 시작 시 auth 상태의 초기값
 *
 * Client 활용:
 * - 앱 로드 시 로그인 안 된 상태로 시작
 * - 모든 값이 "비어있음" 또는 false
 */
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

/**
 * register - 회원가입 비동기 액션
 *
 * Client 활용:
 * - RegisterPage에서 dispatch(register(formData)) 호출
 * - pending: 버튼 비활성화, "Registering..." 표시
 * - fulfilled: 로그인 상태로 전환, /board로 이동
 * - rejected: 에러 메시지 표시 ("Email already exists" 등)
 *
 * localStorage 저장: 새로고침 후에도 로그인 유지하기 위해
 */
export const register = createAsyncThunk(
  "auth/register",
  async (data: RegisterFormData, { rejectWithValue }) => {
    try {
      const response = await authService.register(data);
      // 성공 시 token을 localStorage에 저장 (새로고침 후에도 유지)
      localStorage.setItem("token", response.token);
      return response;
    } catch (error: unknown) {
      // 서버 에러 메시지 추출하여 반환
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        return rejectWithValue(
          axiosError.response?.data?.message || "Registration failed"
        );
      }
      return rejectWithValue("Registration failed");
    }
  }
);

/**
 * authSlice - Auth 상태 관리의 핵심
 *
 * Client 활용:
 * - reducers: 동기 액션 (logout, clearError)
 * - extraReducers: 비동기 액션의 상태 변화 처리 (pending/fulfilled/rejected)
 */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * logout - 로그아웃 처리
     *
     * Client 활용:
     * - Header의 "Logout" 버튼 클릭 시 dispatch(logout())
     * - 모든 인증 상태 초기화 + localStorage 토큰 삭제
     * - 로그인 페이지로 이동
     */
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("token");
    },

    /**
     * clearError - 에러 메시지 초기화
     *
     * Client 활용:
     * - 사용자가 폼을 다시 수정하기 시작할 때 에러 메시지 제거
     * - 또는 에러 토스트의 X 버튼 클릭 시
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // register.pending - API 호출 시작
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // register.fulfilled - API 성공
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      // register.rejected - API 실패
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
