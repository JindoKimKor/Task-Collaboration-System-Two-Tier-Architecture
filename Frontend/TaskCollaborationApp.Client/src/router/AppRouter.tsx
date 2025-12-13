import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { LoginPage } from "../features/auth/pages/LoginPage";

/**
 * AppRouter - 앱 전체 라우팅 정의
 *
 * Client 활용:
 * - URL 경로에 따라 어떤 컴포넌트를 보여줄지 결정
 * - 새 페이지 추가 시 이 파일에 Route 추가
 *
 * 현재 라우트:
 * - /login: 로그인 페이지
 * - /register: 회원가입 페이지
 * - / : 로그인 페이지로 리다이렉트
 */
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 페이지 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 회원가입 페이지 */}
        <Route path="/register" element={<RegisterPage />} />

        {/* 홈 - 로그인 페이지로 이동 */}
        <Route
          path="/"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <a href="/login" className="text-blue-600 hover:underline">
                Go to Login
              </a>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
