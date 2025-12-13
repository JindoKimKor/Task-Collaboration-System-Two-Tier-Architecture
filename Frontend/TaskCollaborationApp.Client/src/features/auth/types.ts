/**
 * Form data for user registration
 * Matches backend RegisterRequestDto fields
 */
export interface RegisterFormData {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string; // Frontend only (not sent to API)
}

/**
 * Props for RegisterForm component
 * Presentational component pattern - receives callbacks from parent
 */
export interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * Validation error messages for each field
 */
export interface ValidationErrors {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Props for FormInput component
 * Reusable input UI component - receives all props from parent
 */
export interface FormInputProps {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}
