export interface BaseErrorOptions {
  /** Machine-readable error code, e.g. "MAX_RETRIES_EXCEEDED" */
  code?: string;
  /** Arbitrary structured metadata relevant to this error */
  context?: Record<string, unknown>;
  /** The original error that caused this one, if any */
  cause?: unknown;
}
