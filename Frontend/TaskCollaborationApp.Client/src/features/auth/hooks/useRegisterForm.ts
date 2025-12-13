import { useState } from 'react';
import type { RegisterFormData, ValidationErrors } from '../types';
import { validateField, validateForm } from '../utils/validation';

/**
 * Custom hook for RegisterForm state management
 * Encapsulates form state, validation, and event handlers
 * @param onSubmit - Callback function when form is valid and submitted
 */
export const useRegisterForm = (onSubmit: (data: RegisterFormData) => void) => {
  // Form field values
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  // Validation error messages
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Track which fields have been touched (visited)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Handle input value change
   * Updates formData and clears error for the field
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Handle input blur (focus lost)
   * Marks field as touched and validates it
   */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate this field
    const error = validateField(
      name as keyof RegisterFormData,
      formData[name as keyof RegisterFormData],
      formData
    );
    
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  /**
   * Handle form submission
   * Validates all fields and calls onSubmit if valid
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      username: true,
      password: true,
      confirmPassword: true,
    });

    // If no errors, call onSubmit
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
