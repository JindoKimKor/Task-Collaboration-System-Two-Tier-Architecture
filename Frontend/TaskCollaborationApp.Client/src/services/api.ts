import axios from "axios";
import type { AuthResponse } from "../features/auth/types/api.types";

/**
 * Axios Instance - 모든 API 요청의 공통 설정
 *
 * Client 활용:
 * - baseURL: 모든 요청이 이 URL을 기준으로 함 (예: api.get('/auth/register') → https://localhost:7001/api/auth/register)
 * - headers: 모든 요청에 Content-Type: application/json 자동 첨부
 * - interceptor: localStorage에 token이 있으면 모든 요청에 Authorization 헤더 자동 첨부
 *
 * 다른 feature(Task, User)에서도 이 instance를 import해서 사용
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor - 매 요청 전에 실행
 *
 * Client 활용:
 * - 로그인 후 localStorage에 저장된 token을 자동으로 헤더에 붙임
 * - 개발자가 매번 token을 수동으로 넣을 필요 없음
 * - 토큰이 없으면 헤더 없이 요청 (로그인/회원가입 요청)
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response Interceptor - 401 에러 시 자동 토큰 갱신 (Task #26)
 *
 * Client 활용:
 * - Access token 만료 시 자동으로 refresh token으로 새 토큰 발급
 * - 원래 요청을 새 토큰으로 재시도 → 사용자는 끊김 없이 계속 사용
 * - Refresh 실패 시 로그인 페이지로 이동
 *
 * 흐름:
 * 1. API 요청 → 401 에러 발생
 * 2. refreshToken으로 POST /auth/refresh 호출
 * 3. 새 토큰 저장 후 원래 요청 재시도
 * 4. refresh도 실패하면 로그아웃 처리
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 + 아직 재시도 안 함 + refresh 요청이 아님
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        // refreshToken 없으면 로그아웃 처리
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // 새 토큰 요청 (api instance 사용하지 않음 - 무한루프 방지)
        const response = await axios.post<AuthResponse>(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        // 새 토큰 저장
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("refreshToken", response.data.refreshToken);

        // 원래 요청에 새 토큰 적용 후 재시도
        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // refresh 실패 시 로그아웃 처리
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
