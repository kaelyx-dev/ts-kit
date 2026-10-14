// Public types for random-string.
// Every exported name must start with "RandomString".

/**
 * Preset character sets for {@link RandomStringOptions.charset}.
 * Each preset is a string, so you can join presets with `+` or add your own characters.
 *
 * @example
 * ```ts
 * const { uppercase, digits } = RandomStringCharset
 * randomString({ charset: uppercase + digits })
 * ```
 */
export const RandomStringCharset = {
  /** `A` to `Z`. */
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  /** `a` to `z`. */
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  /** `0` to `9`. */
  digits: '0123456789',
  /** `0` to `9` and `a` to `f`. */
  hex: '0123456789abcdef',
  /** Symbols that are safe in URLs and file names: `-`, `_` and `.`. */
  symbolsSimple: '-_.',
  /** All printable ASCII symbols. */
  symbols: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
  /** Uppercase letters, lowercase letters and digits. */
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
} as const

/** Options for {@link randomString}. */
export interface RandomStringOptions {
  /** The number of characters in the result. Must be an integer of 0 or more. @default 16 */
  readonly length?: number
  /**
   * The characters to pick from. Duplicate characters are ignored, so each character has the same chance.
   * @default RandomStringCharset.alphanumeric
   */
  readonly charset?: string
}
