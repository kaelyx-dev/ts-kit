/**
 * Types, constants and defaults for the punctuation replacer.
 *
 * Every export carries an explicit type annotation so the module satisfies
 * `isolatedDeclarations`.
 */

/** The punctuation characters supported out of the box. */
export const PUNCTUATION_CHARACTERS = ['.', '!', '?'] as const

/** One of the built-in punctuation characters. */
export type PunctuationCharacter = (typeof PUNCTUATION_CHARACTERS)[number]

/** Trailing whitespace, including Unicode spaces, for the `trim` option. */
export const TRAILING_WHITESPACE: RegExp = /\s+$/u

/** Everything configurable, in one place. The factory merges these over the
 *  defaults, and a single call merges its own over the factory's, so the same
 *  shape works at both levels. */
export interface PunctuationReplacerOptions {
  /** The characters that should be replaced when found at the end.
   *  Defaults to the bound punctuation alphabet. */
  readonly replacementCharacters?: readonly string[]
  /** Strip trailing whitespace before deciding, and drop it from the result. */
  readonly trim?: boolean
  /** Treat a run of replacement characters as one: "What?!" -> "What." */
  readonly collapse?: boolean
  /** Leave a string with no content alone instead of returning bare punctuation. */
  readonly skipEmpty?: boolean
}

/** Every option decided. Adding a field to PunctuationReplacerOptions makes
 *  the factory's `defaults` literal fail to compile until it is given a value. */
export type ResolvedPunctuationReplacerOptions = Required<PunctuationReplacerOptions>

/** Defaults for the behaviour flags. `replacementCharacters` is absent because
 *  its default is the alphabet, which is only known inside `withPunctuation`. */
export const DEFAULT_BEHAVIOUR: Omit<ResolvedPunctuationReplacerOptions, 'replacementCharacters'> =
  {
    trim: true,
    collapse: true,
    skipEmpty: true,
  }

/** A configured replacer. Any option may be overridden for a single call. */
export type PunctuationReplacer = (value: string, overrides?: PunctuationReplacerOptions) => string

/** A punctuation alphabet: the characters allowed as the terminator, and the
 *  default set of characters to replace. Must contain at least one entry. */
export type PunctuationAlphabet = readonly [string, ...string[]]

/** What `withPunctuation` returns: a factory whose terminator is constrained
 *  to the bound alphabet. Named so that declaration emit needs no inference,
 *  which is what `isolatedDeclarations` requires. */
export type PunctuationReplacerFactory<Alphabet extends PunctuationAlphabet> = (
  punctuationCharacter: Alphabet[number],
  options?: PunctuationReplacerOptions,
) => PunctuationReplacer
