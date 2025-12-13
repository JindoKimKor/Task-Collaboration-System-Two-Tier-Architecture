import type { RegisterFormProps, ValidationErrors } from "../types";
import { useRegisterForm } from "../hooks/useRegisterForm";
import { FormInput } from "./FormInput";

/**
 * Registration form component
 * Composes FormInput components with useRegisterForm hook
 * Presentational component - receives onSubmit, loading, error from parent
 */
export const RegisterForm = ({
  onSubmit,
  loading = false,
  error,
}: RegisterFormProps) => {
  const { formData, errors, touched, handleChange, handleBlur, handleSubmit } =
    useRegisterForm(onSubmit);

  // Helper: show error only if field has been touched
  const showError = (field: keyof ValidationErrors) =>
    touched[field] ? errors[field] : undefined;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 bg-white rounded-lg shadow"
    >
      {/* Server error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <FormInput
        name="name"
        label="Name"
        value={formData.name}
        error={showError("name")}
        disabled={loading}
        onChange={handleChange}
        onBlur={handleBlur}
      />

      <FormInput
        name="email"
        label="Email"
        type="email"
        value={formData.email}
        error={showError("email")}
        disabled={loading}
        onChange={handleChange}
        onBlur={handleBlur}
      />

      <FormInput
        name="username"
        label="Username"
        value={formData.username}
        error={showError("username")}
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

      <FormInput
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        value={formData.confirmPassword}
        error={showError("confirmPassword")}
        disabled={loading}
        onChange={handleChange}
        onBlur={handleBlur}
      />

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
        {loading ? "Registering..." : "Register"}
      </button>
    </form>
  );
};
