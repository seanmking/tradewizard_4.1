// src/types/ScrapingError.ts

/**
 * Defines the structure for handling errors related to the scraping process,
 * providing more context for UI and agent interactions.
 */
export interface ScrapingError {
  /** User-friendly error message */
  message: string;
  /** Optional error code (e.g., 'TIMEOUT', 'BLOCKED', 'PARSE_ERROR', 'NOT_FOUND', 'AUTH_FAILED') */
  code?: string;
  /** Indicates if the operation that caused the error might succeed on retry */
  retryable?: boolean;
  /** Suggestion for the user or agent on how to potentially resolve the issue */
  resolutionHint?: string;
}
