/**
 * Central registry of all error codes used across the package.
 * Add a new literal here whenever you add a new error class,
 * so `switch (err.code)` statements in consumer code stay
 * exhaustively checked by TypeScript.
 */
export type ErrorCode =
  | 'UNKNOWN_ERROR'
  | 'TIMEOUT'
  | 'VALIDATION_ERROR'
  | 'MAX_RETRIES_EXCEEDED'
  | 'MAX_BACKOFF_EXCEEDED'
// ...extend as you add more error classes

export interface BaseErrorOptions<
  TContext extends Record<string, unknown> = Record<string, unknown>,
  TCode extends string = ErrorCode,
> {
  /** Machine-readable error code, e.g. "MAX_RETRIES_EXCEEDED" */
  code?: TCode
  /** Structured metadata relevant to this error */
  context?: TContext
  /** The original error that caused this one, if any */
  cause?: unknown
}
