import { createSlice } from "@reduxjs/toolkit";
import { register, login, fetchCurrentUser, googleLogin } from "./authThunks";
import type { AuthState } from "../types/state.types";

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
 * authSlice - Auth 상태 관리의 핵심
 *
 * Client 활용:
 * - reducers: 동기 액션 (logout, clearError)
 * - extraReducers: 비동기 액션의 상태 변화 처리 (pending/fulfilled/rejected)
 *
 * Slice vs Thunk:
 * - Slice: 상태 정의 + 상태 변경 방법 (순수 함수)
 * - Thunk: 비동기 작업 수행 (API 호출, localStorage 등)
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
      localStorage.removeItem("refreshToken");
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
      // ============================================
      // Register Thunk (Task #9)
      // ============================================
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ============================================
      // Login Thunk (Task #16)
      // ============================================
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ============================================
      // FetchCurrentUser Thunk (Task #22)
      // ============================================
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = {
          id: action.payload.id,
          name: action.payload.name,
          email: action.payload.email,
          username: action.payload.username,
          role: action.payload.role,
        };
        state.token = localStorage.getItem("token");
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // ============================================
      // GoogleLogin Thunk (Task #24)
      // ============================================
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
