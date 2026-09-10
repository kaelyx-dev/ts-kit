import {
  DEFAULT_BEHAVIOUR,
  PUNCTUATION_CHARACTERS,
  type PunctuationAlphabet,
  type PunctuationReplacer,
  type PunctuationReplacerFactory,
  type PunctuationReplacerOptions,
  type ResolvedPunctuationReplacerOptions,
  TRAILING_WHITESPACE,
} from './punctuationReplacer.type'

/** Last character as a code point, so astral characters are not cut in half. */
const lastCharacterOf = (value: string): string => {
  if (value.length === 0) return ''
  const code = value.charCodeAt(value.length - 1)
  const isLowSurrogate = code >= 0xdc00 && code <= 0xdfff
  return isLowSurrogate && value.length > 1 ? value.slice(-2) : value.slice(-1)
}

/** The single implementation. Factory defaults and per-call overrides both
 *  arrive here already resolved, so there is one code path. */
const applyPunctuation = (
  value: string,
  punctuationCharacter: string,
  replacementCharacters: ReadonlySet<string>,
  { trim, collapse, skipEmpty }: ResolvedPunctuationReplacerOptions,
): string => {
  const body = trim ? value.replace(TRAILING_WHITESPACE, '') : value

  if (body.length === 0) return skipEmpty ? value : punctuationCharacter

  let last = lastCharacterOf(body)
  if (last === punctuationCharacter) return body

  let end = body.length
  while (replacementCharacters.has(last)) {
    end -= last.length
    if (!collapse) break
    last = lastCharacterOf(body.slice(0, end))
    if (last === '') break
  }

  return body.slice(0, end) + punctuationCharacter
}

/**
 * Bind a replacer factory to a punctuation alphabet.
 *
 * The alphabet constrains the terminator and supplies the default replacement
 * set, so a custom list stays as type safe as the built-in one.
 *
 * @example
 * const ideographicStop = withPunctuation(['。', '！', '？'])('。')
 * ideographicStop('こんにちは？')   // 'こんにちは。'
 */
export const withPunctuation =
  <const Alphabet extends PunctuationAlphabet>(
    alphabet: Alphabet,
  ): PunctuationReplacerFactory<Alphabet> =>
  (
    /** The punctuation character to terminate with */
    punctuationCharacter: Alphabet[number],

    /** Defaults for this replacer, merged over DEFAULT_BEHAVIOUR */
    options?: PunctuationReplacerOptions,
  ): PunctuationReplacer => {
    const defaults: ResolvedPunctuationReplacerOptions = {
      replacementCharacters: alphabet,
      ...DEFAULT_BEHAVIOUR,
      ...options,
    }

    const characters: ReadonlySet<string> = new Set(defaults.replacementCharacters)

    return (value, overrides) => {
      if (overrides === undefined) {
        return applyPunctuation(value, punctuationCharacter, characters, defaults)
      }

      const resolved: ResolvedPunctuationReplacerOptions = {
        ...defaults,
        ...overrides,
      }
      // Identity check, so overriding only the behaviour flags still
      // reuses the set built above.
      const replacementCharacters: ReadonlySet<string> =
        resolved.replacementCharacters === defaults.replacementCharacters
          ? characters
          : new Set(resolved.replacementCharacters)

      return applyPunctuation(value, punctuationCharacter, replacementCharacters, resolved)
    }
  }

/**
 * The standard factory, bound to PUNCTUATION_CHARACTERS.
 *
 * @example
 * const fullstop = createPunctuationReplacer('.')
 * fullstop('hello')                                       // 'hello.'
 * fullstop('What?!')                                      // 'What.'
 * fullstop('What?!', { collapse: false })                 // 'What?.'
 * fullstop('a list;', { replacementCharacters: [';'] })    // 'a list.'
 */
export const createPunctuationReplacer: PunctuationReplacerFactory<typeof PUNCTUATION_CHARACTERS> =
  withPunctuation(PUNCTUATION_CHARACTERS)
