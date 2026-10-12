// Public standalone type Result.
// Every exported name must start with "Result".

/**
 * Represents the result of an operation that can either succeed
 * with a value of type `T` or fail with an error of type `E`.
 *
 * @example
 * ```ts
 * const value: Result<number, string> = { ok: true, value: 42 }
 * const error1: Result<number, string> = { ok: false, error: 'Something went wrong' }
 * const error2: Result<number, Error> = { ok: false, error: new Error('Something went wrong') }
 * const error3: Result<number, SyntaxError> = { ok: false, error: new SyntaxError('Something went wrong') }
 * ```
 *
 * @category types
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }
