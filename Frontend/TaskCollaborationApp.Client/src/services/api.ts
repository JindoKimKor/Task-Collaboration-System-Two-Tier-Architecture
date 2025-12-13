import axios from "axios";

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
  baseURL: import.meta.env.VITE_API_URL || "https://localhost:7158/api",
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

export default api;
