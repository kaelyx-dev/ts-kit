import { type ClampOptions, withDefaults } from '../..'
import { ClampUndefinedBehaviour } from './clamp.types'

export * from './clamp.types'

/**
 * Clamps a number within the specified minimum and maximum bounds.
 *
 * An input of `NaN` or `undefined`, or a bound of `NaN`, is an invalid value. By default an
 * invalid value gives `NaN`. Set `strict` to `true` to use `strictBehaviour` instead.
 *
 * @param input - The number to be clamped.
 * @param options - The options containing the minimum and maximum bounds.
 * @returns The clamped number within the specified bounds. Returns `NaN` for an invalid value
 * when `strict` is `false`. Can return `undefined` for an invalid value when `strict` is `true`.
 * @throws {RangeError} If `min` is greater than `max`.
 *
 * @example
 * ```ts
 * clamp(5, { min: 1, max: 10 }) // 5
 * clamp(-3, { min: 1, max: 10 }) // 1
 * clamp(15, { min: 1, max: 10 }) // 10
 * clamp(NaN, { min: 1, max: 10 }) // NaN
 * clamp(NaN, { min: 1, max: 10, strict: true }) // undefined
 * clamp(NaN, { min: 1, max: 10, strict: true, strictBehaviour: 'clamp-to-lowest' }) // 1
 * clamp(5, { min: 10, max: 1 }) // throws RangeError
 * ```
 *
 * @category number
 */
export function clamp(input: number, options: ClampOptions): number | undefined {
  const opts = withDefaults(options, {
    min: -Number.MAX_VALUE,
    max: Number.MAX_VALUE,
    strict: false,
    strictBehaviour: ClampUndefinedBehaviour.RETURN_UNDEFINED,
  })

  if (opts.min > opts.max) {
    throw new RangeError(`clamp: min (${opts.min}) must not be greater than max (${opts.max})`)
  }

  const isInvalid =
    input === undefined || Number.isNaN(input) || Number.isNaN(opts.min) || Number.isNaN(opts.max)

  if (isInvalid && opts.strict) {
    switch (opts.strictBehaviour) {
      case ClampUndefinedBehaviour.CLAMP_TO_LOWEST:
        return Number.isNaN(opts.min) ? undefined : opts.min
      case ClampUndefinedBehaviour.CLAMP_TO_HIGHEST:
        return Number.isNaN(opts.max) ? undefined : opts.max
      default:
        return undefined
    }
  }

  return Math.min(Math.max(input, opts.min), opts.max)
}
