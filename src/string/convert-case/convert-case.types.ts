// Public types for convert-case.
// Every exported name must start with "ConvertCase".

import type { ValueOf } from '../../types'

/**
 * The cases that {@link convertCase} can produce, for {@link ConvertCaseOptions.to}. Each example
 * converts the words "hello world".
 *
 * @example
 * ```ts
 * convertCase('helloWorld', { to: ConvertCaseStyle.snake }) // 'hello_world'
 * convertCase('helloWorld', { to: 'snake' }) // the same: the plain string also works
 * ```
 *
 * @category string
 */
export const ConvertCaseStyle = {
  /** `hello_world` */
  snake: 'snake',
  /** `HELLO_WORLD` */
  constant: 'constant',
  /** `Hello_World` */
  ada: 'ada',
  /** `hello-world` */
  kebab: 'kebab',
  /** `HELLO-WORLD` */
  cobol: 'cobol',
  /** `Hello-World` */
  train: 'train',
  /** `helloworld` */
  flat: 'flat',
  /** `HELLOWORLD` */
  upperFlat: 'upperFlat',
  /** `HelloWorld` */
  pascal: 'pascal',
  /** `helloWorld` */
  camel: 'camel',
  /** `hello world` */
  lower: 'lower',
  /** `HELLO WORLD` */
  upper: 'upper',
  /** `Hello World` */
  title: 'title',
} as const

/**
 * A case that {@link convertCase} can produce. See the {@link ConvertCaseStyle} values.
 *
 * @category string
 */
export type ConvertCaseStyle = ValueOf<typeof ConvertCaseStyle>

/**
 * How {@link convertCase} reads a run of capitals that is not a known acronym, when the run is
 * next to lowercase letters, as in `'parseABCValue'`. For
 * {@link ConvertCaseOptions.unknownAcronyms}.
 *
 * @category string
 */
export const ConvertCaseUnknownAcronyms = {
  /**
   * The run is one word. If a lowercase letter follows the run, the last capital starts the next
   * word: `'ABCValue'` gives `ABC` and `Value`.
   */
  together: 'together',
  /** Each capital is its own word: `'ABCValue'` gives `A`, `B`, `C` and `Value`. */
  split: 'split',
} as const

/**
 * How {@link convertCase} reads an unknown acronym. See the {@link ConvertCaseUnknownAcronyms}
 * values.
 *
 * @category string
 */
export type ConvertCaseUnknownAcronyms = ValueOf<typeof ConvertCaseUnknownAcronyms>

/**
 * Which word the digits go into when {@link convertCase} reads the input. For
 * {@link ConvertCaseOptions.digits}.
 *
 * @category string
 */
export const ConvertCaseDigits = {
  /**
   * Digits stay with the letters before them. A capital after the digits starts a new word:
   * `'base64Encode'` gives `base64` and `Encode`.
   */
  left: 'left',
  /**
   * Digits start a new word, with the letters after them: `'base64Encode'` gives `base` and
   * `64Encode`.
   */
  right: 'right',
  /** Digits are a word of their own: `'base64Encode'` gives `base`, `64` and `Encode`. */
  separate: 'separate',
} as const

/**
 * Which word the digits go into. See the {@link ConvertCaseDigits} values.
 *
 * @category string
 */
export type ConvertCaseDigits = ValueOf<typeof ConvertCaseDigits>

/**
 * How one case writes the words: what goes between them, and how each word is cased. See
 * {@link ConvertCaseFormats}.
 *
 * @category string
 */
export interface ConvertCaseFormat {
  /** The text that goes between the words, such as `'_'` in snake case. */
  readonly separator: string
  /**
   * Writes one word in the case.
   *
   * @param word - The word, as it is in the input.
   * @param index - The position of the word, from 0.
   * @param isAcronym - `true` if the word is a known acronym.
   * @returns The word in the case.
   */
  readonly word: (word: string, index: number, isAcronym: boolean) => string
}

const lower = (word: string): string => word.toLowerCase()
const upper = (word: string): string => word.toUpperCase()
// The `u` flag makes `.` match a whole code point, so a letter outside the BMP is not cut in half.
const capitalise = (word: string, _index: number, isAcronym: boolean): string =>
  isAcronym ? upper(word) : word.toLowerCase().replace(/^./u, (first) => first.toUpperCase())
const camel = (word: string, index: number, isAcronym: boolean): string =>
  index === 0 ? lower(word) : capitalise(word, index, isAcronym)

// Frozen, so that a change to a format cannot change what convertCase returns. The calls below
// are marked pure so that importing another value from this file does not bundle the formats.
const format = (separator: string, word: ConvertCaseFormat['word']): ConvertCaseFormat =>
  Object.freeze({ separator, word })

/**
 * The {@link ConvertCaseFormat} of each {@link ConvertCaseStyle}: the separator and the casing
 * that {@link convertCase} uses. The object and each format are frozen.
 *
 * @example
 * ```ts
 * ConvertCaseFormats.kebab.separator // '-'
 * ConvertCaseFormats.pascal.word('hello', 0, false) // 'Hello'
 * ```
 *
 * @category string
 */
// The Record type makes a new ConvertCaseStyle fail to compile until it has a format here.
export const ConvertCaseFormats: Readonly<Record<ConvertCaseStyle, ConvertCaseFormat>> =
  /* @__PURE__ */ Object.freeze({
    snake: /* @__PURE__ */ format('_', lower),
    constant: /* @__PURE__ */ format('_', upper),
    ada: /* @__PURE__ */ format('_', capitalise),
    kebab: /* @__PURE__ */ format('-', lower),
    cobol: /* @__PURE__ */ format('-', upper),
    train: /* @__PURE__ */ format('-', capitalise),
    flat: /* @__PURE__ */ format('', lower),
    upperFlat: /* @__PURE__ */ format('', upper),
    pascal: /* @__PURE__ */ format('', capitalise),
    camel: /* @__PURE__ */ format('', camel),
    lower: /* @__PURE__ */ format(' ', lower),
    upper: /* @__PURE__ */ format(' ', upper),
    title: /* @__PURE__ */ format(' ', capitalise),
  })

/**
 * The acronyms that {@link convertCase} knows. Add to them with
 * {@link ConvertCaseOptions.acronyms}.
 *
 * @category string
 */
export const ConvertCaseAcronyms = [
  'API',
  'ASCII',
  'CPU',
  'CSS',
  'CSV',
  'DNS',
  'DOM',
  'FTP',
  'GPU',
  'GUID',
  'HTML',
  'HTTP',
  'HTTPS',
  'ID',
  'IP',
  'JSON',
  'JWT',
  'PDF',
  'SDK',
  'SQL',
  'SSH',
  'SSL',
  'TCP',
  'TLS',
  'UDP',
  'UI',
  'URI',
  'URL',
  'UUID',
  'XML',
  'YAML',
] as const

/**
 * Options for {@link convertCase}.
 *
 * @category string
 */
export interface ConvertCaseOptions {
  /** The case of the result. See {@link ConvertCaseStyle}. */
  readonly to: ConvertCaseStyle

  /**
   * More acronyms to know, in addition to {@link ConvertCaseAcronyms}. Case does not matter.
   *
   * A known acronym has two effects:
   *
   * - A run of capitals that is made only of known acronyms is split into them:
   *   `'XMLHTTPRequest'` gives `XML`, `HTTP` and `Request`.
   * - Where a case starts a word with a capital (ada, train, pascal, camel after the first
   *   word, and title), a known acronym is written in capitals: `'parse_json'` in camel case is
   *   `'parseJSON'`.
   * @default []
   */
  readonly acronyms?: readonly string[]

  /**
   * How to read a run of capitals that is not a known acronym. This applies only to a run that is
   * next to lowercase letters, so an all-capital word such as `HELLO` in `'HELLO_WORLD'` is
   * always one word. See {@link ConvertCaseUnknownAcronyms}.
   * @default ConvertCaseUnknownAcronyms.together
   */
  readonly unknownAcronyms?: ConvertCaseUnknownAcronyms

  /**
   * The smallest number of capitals that make an unknown acronym. A shorter run is split into
   * single letters. With 3, `'IOError'` gives `I`, `O` and `Error`. Must be an integer of 1 or
   * more.
   * @default 2
   */
  readonly minAcronymLength?: number

  /**
   * Which word the digits go into. See {@link ConvertCaseDigits}.
   * @default ConvertCaseDigits.left
   */
  readonly digits?: ConvertCaseDigits
}
