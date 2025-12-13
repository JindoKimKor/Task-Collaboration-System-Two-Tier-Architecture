import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { register } from "../store/authSlice";
import { RegisterForm } from "../components/RegisterForm";
import type { RegisterFormData } from "../types";

/**
 * RegisterPage - 회원가입 페이지 (Container Component)
 *
 * Client 활용:
 * - /register 경로에서 렌더링
 * - RegisterForm(UI)과 authSlice(Redux)를 연결
 * - 회원가입 성공 시 /board로 이동
 *
 * Container 패턴:
 * - RegisterForm은 Redux를 모름 (순수 UI)
 * - RegisterPage가 dispatch, navigate 담당
 */
export const RegisterPage = () => {
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
   * - register thunk 성공 → isAuthenticated = true
   * - useEffect가 감지하여 navigate 호출
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/board");
    }
  }, [isAuthenticated, navigate]);

  /**
   * 폼 제출 핸들러 - RegisterForm의 onSubmit으로 전달
   * - Form이 유효성 검사 통과 후 호출
   * - dispatch로 register thunk 실행
   */
  const handleSubmit = (data: RegisterFormData) => {
    dispatch(register(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        {/* 페이지 타이틀 */}
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>

        {/* RegisterForm에 상태와 핸들러 전달 */}
        <RegisterForm onSubmit={handleSubmit} loading={loading} error={error} />

        {/* 로그인 페이지 링크 */}
        <p className="mt-4 text-center text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};
