import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RegisterPage } from "../features/auth/pages/RegisterPage";

/**
 * AppRouter - 앱 전체 라우팅 정의
 *
 * Client 활용:
 * - URL 경로에 따라 어떤 컴포넌트를 보여줄지 결정
 * - 새 페이지 추가 시 이 파일에 Route 추가
 *
 * 현재 라우트:
 * - /register: 회원가입 페이지
 * - / : 임시 홈 (나중에 redirect 추가)
 */
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 회원가입 페이지 */}
        <Route path="/register" element={<RegisterPage />} />

        {/* 임시 홈 - 나중에 LoginPage 또는 redirect로 변경 */}
        <Route
          path="/"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <a href="/register" className="text-blue-600 hover:underline">
                Go to Register
              </a>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
