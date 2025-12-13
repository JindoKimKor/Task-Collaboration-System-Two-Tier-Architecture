import type { FormInputProps } from "../types/form.types";

/**
 * FormInput - 재사용 가능한 입력 필드 컴포넌트
 *
 * Client 활용:
 * - RegisterForm, LoginForm 등에서 각 필드마다 렌더링
 * - 일관된 스타일의 label + input + error message 조합 제공
 * - Props만 받아서 렌더링하는 Presentational 컴포넌트 (상태 없음)
 */
export const FormInput = ({
  name,
  label,
  type = "text",
  value,
  error,
  disabled = false,
  onChange,
  onBlur,
}: FormInputProps) => {
  return (
    <div className="mb-4">
      {/* 
        label - 입력 필드 위에 표시되는 레이블
        Client 활용: 사용자에게 어떤 정보를 입력해야 하는지 안내
      */}
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>

      {/*
        input - 실제 입력 필드
        Client 활용:
        - value: formData의 현재 값 표시 (controlled)
        - onChange: 타이핑 시 useRegisterForm의 handleChange 호출
        - onBlur: 포커스 이탈 시 useRegisterForm의 handleBlur 호출 → 검증
        - error 유무에 따라 테두리 색상 변경 (빨강/회색)
        - disabled: loading 중일 때 입력 비활성화
      */}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 
          ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }
          ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
      />

      {/*
        error message - 유효성 검사 실패 시 표시
        Client 활용: touched 상태이고 error가 있을 때만 빨간 텍스트로 표시
      */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
