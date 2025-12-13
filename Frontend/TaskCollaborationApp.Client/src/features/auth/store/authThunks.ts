import { createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../services/authService";
import type { RegisterFormData, LoginFormData } from "../types/form.types";

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
 * login - 로그인 비동기 액션
 *
 * Client 활용:
 * - LoginPage에서 dispatch(login(formData)) 호출
 * - pending: 버튼 비활성화, "Signing in..." 표시
 * - fulfilled: 로그인 상태로 전환, /board로 이동
 * - rejected: 에러 메시지 표시 ("Invalid credentials" 등)
 *
 * localStorage 저장: 새로고침 후에도 로그인 유지하기 위해
 */
export const login = createAsyncThunk(
  "auth/login",
  async (data: LoginFormData, { rejectWithValue }) => {
    try {
      const response = await authService.login(data);
      // 성공 시 token을 localStorage에 저장 (새로고침 후에도 유지)
      localStorage.setItem("token", response.token);
      localStorage.setItem("refreshToken", response.refreshToken);
      return response;
    } catch (error: unknown) {
      // 서버 에러 메시지 추출하여 반환
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        return rejectWithValue(
          axiosError.response?.data?.message || "Login failed"
        );
      }
      return rejectWithValue("Login failed");
    }
  }
);

/**
 * fetchCurrentUser - 현재 사용자 정보 조회 비동기 액션
 *
 * Client 활용:
 * - App.tsx에서 앱 시작 시 dispatch(fetchCurrentUser()) 호출
 * - localStorage에 token이 있을 때만 호출
 * - pending: 로딩 스피너 표시
 * - fulfilled: 사용자 상태 복원, isAuthenticated = true
 * - rejected: 토큰 무효 → localStorage 클리어, 로그인 페이지로
 *
 * 언제 호출되는가:
 * - 브라우저 새로고침 시 (Redux store 초기화됨)
 * - 탭 재방문 시
 * - 앱 최초 로드 시
 */
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.fetchCurrentUser();
      return response;
    } catch (error: unknown) {
      // 401 에러 시 토큰 삭제 (만료 또는 무효)
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        if (axiosError.response?.status === 401) {
          return rejectWithValue("Session expired. Please login again.");
        }
        return rejectWithValue(
          axiosError.response?.data?.message || "Failed to fetch user"
        );
      }
      return rejectWithValue("Failed to fetch user");
    }
  }
);

/**
 * googleLogin - Google OAuth 로그인 비동기 액션
 *
 * Client 활용:
 * - GoogleSignInButton에서 onSuccess 시 dispatch(googleLogin(credential)) 호출
 * - pending: 로딩 표시
 * - fulfilled: 로그인 상태로 전환, /board로 이동
 * - rejected: 에러 메시지 표시 ("Google auth failed" 등)
 *
 * localStorage 저장: 새로고침 후에도 로그인 유지하기 위해
 */
export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (idToken: string, { rejectWithValue }) => {
    try {
      const response = await authService.googleLogin(idToken);
      // 성공 시 token을 localStorage에 저장 (새로고침 후에도 유지)
      localStorage.setItem("token", response.token);
      localStorage.setItem("refreshToken", response.refreshToken);
      return response;
    } catch (error: unknown) {
      // 서버 에러 메시지 추출하여 반환
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        return rejectWithValue(
          axiosError.response?.data?.message || "Google login failed"
        );
      }
      return rejectWithValue("Google login failed");
    }
  }
);
