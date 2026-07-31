export const AUTH_CONSTANTS = {
  RESET_TOKEN_EXPIRY_HOURS: 24,
  MIN_PASSWORD_LENGTH: 8,
  SALT_ROUNDS: 10,
  TOKEN_BYTES_LENGTH: 32,
  EMAIL_VERIFICATION_EXPIRY_HOURS: 1,
  RESET_CODE_EXPIRY_MINUTES: 30,
  VERIFICATION_CODE_EXPIRY_MINUTES: 30,
} as const;

export const AUTH_MESSAGES = {
  PASSWORD_RESET_SENT: 'If an account exists with this email, a password reset link has been sent.',
  PASSWORD_RESET_SUCCESS: 'Password has been reset successfully',
  PASSWORD_TOO_SHORT: `Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters long`,
  INVALID_TOKEN: 'Invalid or expired reset token',
  TOKEN_EXPIRED: 'Reset token has expired',
  EMAIL_EXISTS: 'Email already exists!',
  PHONE_NUMBER_EXISTS: 'Phone number already exists!',
  USER_NOT_FOUND: 'User not found!',
  USER_NOT_ACTIVE: 'User is not active',
  USER_EMAIL_NOT_VERIFIED: 'User email not verified',
  USER_DELETED: 'User is deleted',
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_VERIFIED_SUCCESSFULLY: 'Email verified successfully!',
  EMAIL_VERIFICATION_EXPIRED: 'Verification token has expired. Please request a new one.',
  EMAIL_VERIFICATION_SENT: 'Verification email has been sent. Please check your inbox.',
  EMAIL_VERIFICATION_FAILED: 'Failed to send verification email',
  EMAIL_ALREADY_VERIFIED: 'Email is already verified',
  EMAIL_ACCOUNT_DELETED: 'User account has been deleted',
  INVALID_VERIFICATION_TOKEN: 'Invalid verification token',
  EMAIL_NOT_FOUND: 'Email not found',
  TOO_MANY_FAILED_ATTEMPTS: 'Too many failed attempts. Please try again later.',
  RESET_CODE_SENT: 'If an account exists, a reset code will be sent to the email.',
  RESET_CODE_LOCKED: 'Too many failed attempts. Account locked for 15 minutes.',
  INVALID_RESET_CODE: 'Invalid reset code',
  NO_RESET_REQUEST_FOUND: 'No reset request found',
  RESET_CODE_EXPIRED: 'Reset code has expired',
} as const;

export type AuthConstants = typeof AUTH_CONSTANTS;
export type AuthMessages = typeof AUTH_MESSAGES;
