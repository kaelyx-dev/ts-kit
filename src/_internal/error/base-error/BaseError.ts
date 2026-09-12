import type { BaseErrorOptions } from './BaseError.type'

export class BaseError extends Error {
  /** Machine-readable code for discriminating error types */
  public readonly code: string;

  /** Structured metadata attached to this error */
  public readonly context: Record<string, unknown>;

  /** Timestamp (ms since epoch) when the error was created */
  public readonly timestamp: number;

  constructor(message: string, options: BaseErrorOptions = {}) {
    // Pass `cause` through to native Error (ES2022+)
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);

    // Fix the prototype chain — required when targeting ES5/CommonJS,
    // otherwise `instanceof SubclassError` breaks after transpilation.
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = new.target.name;
    this.code = options.code ?? "UNKNOWN_ERROR";
    this.context = options.context ?? {};
    this.timestamp = Date.now();

    // Exclude constructor from the stack trace (V8 only, no-op elsewhere)
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, new.target);
    }
  }

  /**
   * Type guard: check if an unknown value is an instance of this error class
   * (or a subclass). Useful for `catch (err)` blocks with `unknown` typing.
   */
  static is<T extends typeof BaseError>(
    this: T,
    error: unknown
  ): error is InstanceType<T> {
    return error instanceof this;
  }

  /** Safe JSON serialization — avoids leaking the raw `cause`/stack unintentionally. */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      cause: this.cause instanceof Error ? this.cause.message : this.cause,
      stack: this.stack,
    };
  }
}