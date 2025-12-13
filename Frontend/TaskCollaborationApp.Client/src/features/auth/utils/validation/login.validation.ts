import type {
  LoginFormData,
  LoginValidationErrors,
} from "../../types/form.types";

/**
 * validateLoginField - 로그인 폼 단일 필드 유효성 검사
 *
 * Client 활용:
 * - handleBlur에서 호출: 사용자가 필드를 떠날 때 해당 필드만 검증
 * - 반환값이 있으면 FormInput의 error prop으로 전달되어 빨간 메시지 표시
 *
 * @param name - 검증할 필드 이름
 * @param value - 필드 값
 * @returns 에러 메시지 또는 undefined (유효한 경우)
 */
export const validateLoginField = (
  name: keyof LoginFormData,
  value: string
): string | undefined => {
  switch (name) {
    case "usernameOrEmail":
      if (!value.trim()) return "Username or email is required";
      return undefined;

    case "password":
      if (!value) return "Password is required";
      return undefined;

    default:
      return undefined;
  }
};

/**
 * validateLoginForm - 로그인 폼 전체 유효성 검사
 *
 * Client 활용:
 * - handleSubmit에서 호출: 제출 버튼 클릭 시 모든 필드 한번에 검증
 * - 반환된 errors 객체가 비어있으면 유효 → onSubmit 콜백 실행
 *
 * @param data - 검증할 폼 데이터
 * @returns 에러가 있는 필드들의 에러 메시지 객체
 */
export const validateLoginForm = (
  data: LoginFormData
): LoginValidationErrors => {
  const errors: LoginValidationErrors = {};

  const usernameOrEmailError = validateLoginField(
    "usernameOrEmail",
    data.usernameOrEmail
  );
  if (usernameOrEmailError) errors.usernameOrEmail = usernameOrEmailError;

  const passwordError = validateLoginField("password", data.password);
  if (passwordError) errors.password = passwordError;

  return errors;
};
