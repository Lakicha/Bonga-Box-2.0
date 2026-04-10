export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateReport = (
  category: string,
  location: string,
  description: string
): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!category) {
    errors.category = 'Please select a report category';
  }

  if (!location) {
    errors.location = 'Please select a location';
  }

  if (!description) {
    errors.description = 'Please provide a description';
  } else if (description.length < 10) {
    errors.description = 'Description should be at least 10 characters';
  } else if (description.length > 5000) {
    errors.description = 'Description should not exceed 5000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateFile = (file: File, maxSizeMB: number = 25): ValidationResult => {
  const errors: Record<string, string> = {};
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    errors.size = `File size should not exceed ${maxSizeMB}MB`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: Record<string, string> = {};

  if (password.length < 8) {
    errors.length = 'Password should be at least 8 characters';
  }

  if (!/[A-Z]/.test(password)) {
    errors.uppercase = 'Password should contain at least one uppercase letter';
  }

  if (!/[a-z]/.test(password)) {
    errors.lowercase = 'Password should contain at least one lowercase letter';
  }

  if (!/[0-9]/.test(password)) {
    errors.number = 'Password should contain at least one number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
