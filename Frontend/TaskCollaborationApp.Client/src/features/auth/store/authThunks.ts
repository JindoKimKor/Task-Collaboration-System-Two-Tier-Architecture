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
