import { splitWords } from '../../_internal/string/words/words'
import { withDefaults } from '../../object'
import {
  ConvertCaseAcronyms,
  ConvertCaseDigits,
  ConvertCaseFormats,
  type ConvertCaseOptions,
  ConvertCaseUnknownAcronyms,
} from './convert-case.types'

export * from './convert-case.types'

const upper = (word: string): string => word.toUpperCase()

/**
 * Converts a string to another case, for example from `camelCase` to `snake_case`. The input can
 * be in any case: the function splits it into words first, then writes the words in the new case.
 *
 * Words are separated by any character that is not a letter or a digit, and by a change from
 * lowercase to uppercase. A run of capitals is an acronym, so `'parseABCValue'` has the words
 * `parse`, `ABC` and `Value`. The options control how acronyms and digits are read:
 *
 * - Known acronyms ({@link ConvertCaseAcronyms} and `acronyms`) split a run of capitals that is
 *   made only of them, and they stay in capitals where a case starts a word with a capital.
 * - `unknownAcronyms` and `minAcronymLength` control the other runs of capitals.
 * - `digits` controls which word the digits go into.
 *
 * @param input - The string to convert. If it has no letters or digits, the result is `''`.
 * @param options - The case of the result, and how to read acronyms and digits. See {@link ConvertCaseOptions}.
 * @returns The words of the input, written in the new case.
 * @throws {TypeError} If `options.to` is not a {@link ConvertCaseStyle}.
 * @throws {RangeError} If `options.minAcronymLength` is not an integer of 1 or more.
 *
 * @example
 * ```ts
 * convertCase('helloWorld', { to: 'snake' }) // 'hello_world'
 * convertCase('hello world', { to: 'constant' }) // 'HELLO_WORLD'
 * convertCase('hello world', { to: 'ada' }) // 'Hello_World'
 * convertCase('HelloWorld', { to: 'kebab' }) // 'hello-world'
 * convertCase('hello_world', { to: 'cobol' }) // 'HELLO-WORLD'
 * convertCase('hello world', { to: 'train' }) // 'Hello-World'
 * convertCase('Hello World', { to: 'flat' }) // 'helloworld'
 * convertCase('hello-world', { to: 'upperFlat' }) // 'HELLOWORLD'
 * convertCase('hello_world', { to: 'pascal' }) // 'HelloWorld'
 * convertCase('HELLO_WORLD', { to: 'camel' }) // 'helloWorld'
 * convertCase('helloWorld', { to: 'lower' }) // 'hello world'
 * convertCase('helloWorld', { to: 'upper' }) // 'HELLO WORLD'
 * convertCase('hello_world', { to: 'title' }) // 'Hello World'
 * convertCase('', { to: 'camel' }) // ''
 *
 * // The option values are also exported as objects
 * convertCase('helloWorld', { to: ConvertCaseStyle.snake }) // 'hello_world'
 * convertCase('base64Encode', { to: ConvertCaseStyle.snake, digits: ConvertCaseDigits.separate }) // 'base_64_encode'
 *
 * // Acronyms
 * convertCase('XMLHTTPRequest', { to: 'snake' }) // 'xml_http_request'
 * convertCase('xml_http_request', { to: 'pascal' }) // 'XMLHTTPRequest'
 * convertCase('my_gql_api', { to: 'camel', acronyms: ['GQL'] }) // 'myGQLAPI'
 * convertCase('parseABCValue', { to: 'snake', unknownAcronyms: 'split' }) // 'parse_a_b_c_value'
 * convertCase('IOError', { to: 'snake', minAcronymLength: 3 }) // 'i_o_error'
 *
 * // Digits
 * convertCase('base64Encode', { to: 'snake' }) // 'base64_encode'
 * convertCase('base64Encode', { to: 'snake', digits: 'right' }) // 'base_64encode'
 * convertCase('base64Encode', { to: 'snake', digits: 'separate' }) // 'base_64_encode'
 *
 * convertCase('hello', { to: 'snake', minAcronymLength: 0 }) // throws RangeError
 * ```
 *
 * @category string
 */
export function convertCase(input: string, options: ConvertCaseOptions): string {
  const opts = withDefaults(options, {
    acronyms: [],
    unknownAcronyms: ConvertCaseUnknownAcronyms.together,
    minAcronymLength: 2,
    digits: ConvertCaseDigits.left,
  } as const)

  // Object.hasOwn, so that a name from the prototype such as 'toString' is not read as a case.
  if (!Object.hasOwn(ConvertCaseFormats, opts.to)) {
    throw new TypeError(`convertCase: "${String(opts.to)}" is not a case`)
  }
  if (!Number.isInteger(opts.minAcronymLength) || opts.minAcronymLength < 1) {
    throw new RangeError(
      `convertCase: minAcronymLength (${opts.minAcronymLength}) must be an integer of 1 or more`,
    )
  }

  const acronyms = new Set([...ConvertCaseAcronyms, ...opts.acronyms.map(upper)])
  const { separator, word } = ConvertCaseFormats[opts.to]
  return splitWords(input, { ...opts, acronyms })
    .map((text, index) => word(text, index, acronyms.has(upper(text))))
    .join(separator)
}
