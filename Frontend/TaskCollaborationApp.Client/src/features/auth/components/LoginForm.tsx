import type {
  LoginFormProps,
  LoginValidationErrors,
} from "../types/form.types";
import { useLoginForm } from "../hooks/useLoginForm";
import { FormInput } from "./FormInput";

/**
 * LoginForm - 로그인 폼 컴포넌트
 *
 * Client 활용:
 * - LoginPage에서 렌더링
 * - useLoginForm 훅으로 상태 관리, FormInput으로 각 필드 렌더링
 * - Presentational 컴포넌트: 상태 로직은 훅에, UI는 FormInput에 위임
 *
 * Props:
 * - onSubmit: 유효한 폼 제출 시 LoginPage가 Redux dispatch 실행
 * - loading: API 호출 중 버튼 비활성화
 * - error: 서버 에러 메시지 표시
 */
export const LoginForm = ({
  onSubmit,
  loading = false,
  error,
}: LoginFormProps) => {
  /**
   * useLoginForm 훅에서 폼 상태와 핸들러 가져오기
   * - formData: 각 필드의 현재 입력값
   * - errors: 클라이언트 유효성 검사 에러
   * - touched: 사용자가 건드린 필드 추적
   * - handleChange/handleBlur/handleSubmit: 이벤트 핸들러
   */
  const { formData, errors, touched, handleChange, handleBlur, handleSubmit } =
    useLoginForm(onSubmit);

  /**
   * showError - touched 상태인 필드만 에러 표시
   *
   * Client 활용:
   * - 폼 로드 직후 모든 에러를 보여주지 않음 (UX 개선)
   * - 사용자가 필드를 떠난 후에만 에러 표시
   */
  const showError = (field: keyof LoginValidationErrors) =>
    touched[field] ? errors[field] : undefined;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 bg-white rounded-lg shadow"
    >
      {/*
        서버 에러 메시지 - API 호출 실패 시 표시
        Client 활용: "Invalid credentials" 같은 서버 응답 에러를 빨간 박스로 표시
      */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/*
        FormInput 컴포넌트들 - 각 필드를 동일한 스타일로 렌더링
        Client 활용: 
        - value: controlled component로 현재 입력값 표시
        - error: touched 상태일 때만 에러 메시지 전달
        - disabled: loading 중 입력 비활성화
        - onChange/onBlur: 훅의 핸들러 전달
      */}
      <FormInput
        name="usernameOrEmail"
        label="Username or Email"
        value={formData.usernameOrEmail}
        error={showError("usernameOrEmail")}
        disabled={loading}
        onChange={handleChange}
        onBlur={handleBlur}
      />

      <FormInput
        name="password"
        label="Password"
        type="password"
        value={formData.password}
        error={showError("password")}
        disabled={loading}
        onChange={handleChange}
        onBlur={handleBlur}
      />

      {/*
        제출 버튼
        Client 활용:
        - loading 중: 비활성화 + "Signing in..." 텍스트 + 연한 파란색
        - 평상시: "Sign In" 텍스트 + 진한 파란색 + hover 효과
      */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 px-4 rounded-md text-white font-medium
          ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
};
