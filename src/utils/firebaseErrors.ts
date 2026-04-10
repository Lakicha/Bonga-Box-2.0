import { FirebaseError } from 'firebase/app';

export interface FirebaseErrorDetails {
  message: string;
  code: string;
  userMessage: string;
}

const firebaseErrorMessages: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email. Please sign up first.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters long.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
  'auth/too-many-requests': 'Too many login attempts. Please try again later.',
  'permission-denied': 'You do not have permission to perform this action.',
  'not-found': 'The requested resource was not found.',
  'already-exists': 'This resource already exists.',
  'failed-precondition': 'The operation failed due to a failed precondition.',
  'aborted': 'The operation was aborted. Please try again.',
  'out-of-range': 'The operation was out of range.',
  'unimplemented': 'This feature is not yet implemented.',
  'internal': 'An internal server error occurred. Please try again later.',
  'unavailable': 'The service is currently unavailable. Please try again later.',
  'data-loss': 'Unrecoverable data loss or data corruption occurred.',
  'unauthenticated': 'Please sign in to perform this action.',
};

export const getFirebaseErrorMessage = (error: unknown): FirebaseErrorDetails => {
  if (error instanceof FirebaseError) {
    const userMessage = firebaseErrorMessages[error.code] || error.message;
    return {
      code: error.code,
      message: error.message,
      userMessage,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'unknown',
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again.',
    };
  }

  return {
    code: 'unknown',
    message: 'Unknown error',
    userMessage: 'An unexpected error occurred. Please try again.',
  };
};

export const logError = (context: string, error: unknown) => {
  const details = getFirebaseErrorMessage(error);
  console.error(`[${context}]`, {
    code: details.code,
    message: details.message,
    timestamp: new Date().toISOString(),
  });
};
