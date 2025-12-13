import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { login } from "../store/authThunks";
import { LoginForm } from "../components/LoginForm";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import type { LoginFormData } from "../types/form.types";

/**
 * LoginPage - 로그인 페이지 (Container Component)
 *
 * Client 활용:
 * - /login 경로에서 렌더링
 * - LoginForm(UI)과 authSlice(Redux)를 연결
 * - 로그인 성공 시 /board로 이동
 *
 * Container 패턴:
 * - LoginForm은 Redux를 모름 (순수 UI)
 * - LoginPage가 dispatch, navigate 담당
 */
export const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  /**
   * Redux 상태 구독
   * - loading: 버튼 비활성화용
   * - error: 서버 에러 표시용
   * - isAuthenticated: 로그인 성공 감지용
   */
  const { loading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  /**
   * 로그인 성공 시 /board로 이동
   * - login thunk 성공 → isAuthenticated = true
   * - useEffect가 감지하여 navigate 호출
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/board");
    }
  }, [isAuthenticated, navigate]);

  /**
   * 폼 제출 핸들러 - LoginForm의 onSubmit으로 전달
   * - Form이 유효성 검사 통과 후 호출
   * - dispatch로 login thunk 실행
   */
  const handleSubmit = (data: LoginFormData) => {
    dispatch(login(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        {/* 페이지 타이틀 */}
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>

        {/* LoginForm에 상태와 핸들러 전달 */}
        <LoginForm onSubmit={handleSubmit} loading={loading} error={error} />

        {/* 구분선 */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Google 로그인 버튼 */}
        <GoogleSignInButton />

        {/* 회원가입 페이지 링크 */}
        <p className="mt-4 text-center text-gray-600">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
};
