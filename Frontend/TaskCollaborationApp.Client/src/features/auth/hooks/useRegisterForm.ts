import { useState } from "react";
import type { RegisterFormData, ValidationErrors } from "../types";
import { validateField, validateForm } from "../utils/validation";

/**
 * useRegisterForm - 회원가입 폼 상태 관리 커스텀 훅
 *
 * Client 활용:
 * - RegisterForm 컴포넌트가 마운트될 때 호출
 * - 폼의 모든 상태(입력값, 에러, 터치 여부)를 관리
 * - 이벤트 핸들러를 반환하여 FormInput에 전달
 *
 * @param onSubmit - 폼이 유효할 때 호출될 콜백 (RegisterPage에서 Redux dispatch 실행)
 */
export const useRegisterForm = (onSubmit: (data: RegisterFormData) => void) => {
  /**
   * formData - 각 입력 필드의 현재 값
   *
   * Client 활용:
   * - FormInput의 value prop으로 전달 (controlled component)
   * - 타이핑할 때마다 handleChange가 업데이트
   */
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  /**
   * errors - 각 필드의 유효성 검사 에러 메시지
   *
   * Client 활용:
   * - FormInput의 error prop으로 전달 (빨간 테두리 + 에러 메시지 표시)
   * - blur 시 해당 필드만 업데이트, submit 시 전체 업데이트
   */
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * touched - 각 필드를 사용자가 건드렸는지 여부
   *
   * Client 활용:
   * - 에러를 즉시 보여주지 않고, 사용자가 필드를 떠난 후에만 표시
   * - showError 함수에서 touched[field] && errors[field] 조건으로 사용
   */
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * handleChange - 입력값 변경 핸들러
   *
   * Client 활용:
   * - FormInput의 onChange prop으로 전달
   * - 타이핑할 때마다 호출되어 formData 업데이트
   * - 타이핑 시작하면 해당 필드의 에러 메시지 제거 (UX 개선)
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // 타이핑 시작하면 에러 제거
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * handleBlur - 포커스 이탈 핸들러
   *
   * Client 활용:
   * - FormInput의 onBlur prop으로 전달
   * - 사용자가 필드를 떠날 때 호출
   * - touched를 true로 설정하고, 해당 필드만 검증하여 에러 표시
   */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // 해당 필드만 검증
    const error = validateField(
      name as keyof RegisterFormData,
      formData[name as keyof RegisterFormData],
      formData
    );

    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  /**
   * handleSubmit - 폼 제출 핸들러
   *
   * Client 활용:
   * - form의 onSubmit prop으로 전달
   * - 제출 버튼 클릭 또는 Enter 키 시 호출
   * - 모든 필드를 touched로 설정하고 전체 검증
   * - 유효하면 onSubmit 콜백 실행 (Redux dispatch로 API 호출)
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 전체 필드 검증
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    // 모든 필드를 touched로 설정 (모든 에러 표시)
    setTouched({
      name: true,
      email: true,
      username: true,
      password: true,
      confirmPassword: true,
    });

    // 에러 없으면 onSubmit 콜백 실행
    if (Object.keys(validationErrors).length === 0) {
      onSubmit(formData);
    }
  };

  return {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
  };
};
