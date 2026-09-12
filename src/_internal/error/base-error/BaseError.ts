import type { BaseErrorOptions, ErrorCode } from './BaseError.type'

/**
 * Base class for all custom errors in this package.
 *
 * - Fixes `name` and the prototype chain (so `instanceof` survives ES5/CommonJS transpilation)
 * - Generic over `TContext` for strongly-typed `.context` access
 * - Generic over `TCode` so subclasses can pin themselves to a single literal,
 *   enabling exhaustive `switch (err.code)` checks in consumer code
 * - Supports native `cause` chaining (ES2022+)
 * - `toJSON` for safe logging/serialization
 */
export class BaseError<
  TContext extends Record<string, unknown> = Record<string, unknown>,
  TCode extends string = ErrorCode,
> extends Error {
  public readonly code: TCode
  public readonly context: TContext
  public readonly timestamp: number

  constructor(message: string, options: BaseErrorOptions<TContext, TCode> = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined)

    // Fix the prototype chain — required when targeting ES5/CommonJS,
    // otherwise `instanceof SubclassError` breaks after transpilation.
    Object.setPrototypeOf(this, new.target.prototype)

    this.name = new.target.name
    this.code = (options.code ?? 'UNKNOWN_ERROR') as TCode
    this.context = (options.context ?? {}) as TContext
    this.timestamp = Date.now()

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, new.target)
    }
  }

  /**
   * Type guard: check if an unknown value is an instance of this error class
   * (or a subclass). Narrows `.context` and `.code` to the subclass's types.
   */
  static is<T extends typeof BaseError<Record<string, unknown>, string>>(
    this: T,
    error: unknown,
  ): error is InstanceType<T> {
    // The constructor receiver must remain subclass-aware for this guard.
    // biome-ignore lint/complexity/noThisInStatic: subclass constructors provide the runtime type guard
    return error instanceof this
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
    }
  }
}
