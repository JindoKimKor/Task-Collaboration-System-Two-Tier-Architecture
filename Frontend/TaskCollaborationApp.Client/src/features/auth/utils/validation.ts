import type { RegisterFormData, ValidationErrors } from "../types";

/**
 * Validate a single form field
 * @param name - Field name to validate
 * @param value - Field value
 * @param formData - Full form data (needed for confirmPassword comparison)
 * @returns Error message or undefined if valid
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
 * Validate entire form
 * @param data - Form data to validate
 * @returns Object containing error messages for invalid fields
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
