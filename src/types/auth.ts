/**
 * Represents a stored OTP record for a specific email.
 * Using a per-email structure ensures OTPs are independent across users.
 */
export interface OtpRecord {
  otp: string;
  email: string;
  expiresAt: number; // Date.now() + 60000
  attempts: number; // current failed attempt count
}

/**
 * Result of an OTP validation attempt.
 */
export interface OtpValidationResult {
  success: boolean;
  error?: 'expired' | 'max_attempts' | 'invalid' | 'not_found';
  remainingAttempts?: number;
}

/**
 * Active session data after successful login.
 */
export interface SessionData {
  email: string;
  loginTime: number; // Date.now() timestamp
}

/**
 * Analytics event types that must be logged per assignment requirements.
 */
export type AnalyticsEventType =
  | 'otp_generated'
  | 'otp_validation_success'
  | 'otp_validation_failure'
  | 'user_logout';

/**
 * Structure for a logged analytics event.
 */
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  payload?: Record<string, unknown>;
}
