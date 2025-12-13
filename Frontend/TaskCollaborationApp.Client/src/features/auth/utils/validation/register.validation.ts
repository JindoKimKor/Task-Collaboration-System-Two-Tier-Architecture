import type {
  RegisterFormData,
  ValidationErrors,
} from "../../types/form.types";

/**
 * validateField - 단일 필드 유효성 검사
 *
 * Client 활용:
 * - handleBlur에서 호출: 사용자가 필드를 떠날 때 해당 필드만 검증
 * - handleSubmit에서 validateForm을 통해 호출: 제출 시 전체 검증
 * - 반환값이 있으면 FormInput의 error prop으로 전달되어 빨간 메시지 표시
 *
 * @param name - 검증할 필드 이름
 * @param value - 필드 값
 * @param formData - 전체 폼 데이터 (confirmPassword 비교에 필요)
 * @returns 에러 메시지 또는 undefined (유효한 경우)
 */
export const validateField = (
  name: keyof RegisterFormData,
  value: string,
  formData?: RegisterFormData
): string | undefined => {
  switch (name) {
    case "name":
      if (!value.trim()) return "Name is required";
      if (value.length > 100) return "Name cannot exceed 100 characters";
      return undefined;

    case "email":
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Invalid email format";
      return undefined;

    case "username":
      if (!value.trim()) return "Username is required";
      if (value.length < 3) return "Username must be at least 3 characters";
      if (value.length > 50) return "Username cannot exceed 50 characters";
      return undefined;

    case "password":
      if (!value) return "Password is required";
      if (value.length < 8) return "Password must be at least 8 characters";
      return undefined;

    case "confirmPassword":
      if (!value) return "Please confirm your password";
      if (formData && value !== formData.password)
        return "Passwords do not match";
      return undefined;

    default:
      return undefined;
  }
};

/**
 * validateForm - 전체 폼 유효성 검사
 *
 * Client 활용:
 * - handleSubmit에서 호출: 제출 버튼 클릭 시 모든 필드 한번에 검증
 * - 반환된 errors 객체가 비어있으면 유효 → onSubmit 콜백 실행
 * - 반환된 errors 객체에 내용이 있으면 무효 → 에러 표시, 제출 중단
 *
 * @param data - 검증할 폼 데이터
 * @returns 에러가 있는 필드들의 에러 메시지 객체
 */
export const validateForm = (data: RegisterFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  const nameError = validateField("name", data.name);
  if (nameError) errors.name = nameError;

  const emailError = validateField("email", data.email);
  if (emailError) errors.email = emailError;

  const usernameError = validateField("username", data.username);
  if (usernameError) errors.username = usernameError;

  const passwordError = validateField("password", data.password);
  if (passwordError) errors.password = passwordError;

  const confirmPasswordError = validateField(
    "confirmPassword",
    data.confirmPassword,
    data
  );
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  return errors;
};
