import { describe, expect, expectTypeOf, it } from 'vitest'
import { convertCase } from './convert-case'
import {
  ConvertCaseAcronyms,
  ConvertCaseDigits,
  ConvertCaseFormats,
  type ConvertCaseOptions,
  ConvertCaseStyle,
  ConvertCaseUnknownAcronyms,
} from './convert-case.types'

// The same words, written in each case that convertCase can read.
const inputs = [
  'hello world',
  'helloWorld',
  'HelloWorld',
  'hello_world',
  'HELLO_WORLD',
  'hello-world',
  'Hello-World',
  'Hello World',
  '  hello   world  ',
]

const expected: Record<ConvertCaseStyle, string> = {
  snake: 'hello_world',
  constant: 'HELLO_WORLD',
  ada: 'Hello_World',
  kebab: 'hello-world',
  cobol: 'HELLO-WORLD',
  train: 'Hello-World',
  flat: 'helloworld',
  upperFlat: 'HELLOWORLD',
  pascal: 'HelloWorld',
  camel: 'helloWorld',
  lower: 'hello world',
  upper: 'HELLO WORLD',
  title: 'Hello World',
}

const styles = Object.keys(expected) as ConvertCaseStyle[]

describe('convertCase', () => {
  describe.each(styles)('to %s', (to) => {
    it.each(inputs)('converts %j', (input) => {
      expect(convertCase(input, { to })).toBe(expected[to])
    })

    it('returns an empty string for empty input', () => {
      expect(convertCase('', { to })).toBe('')
    })

    it('returns an empty string when the input has only separators', () => {
      expect(convertCase(' _- ', { to })).toBe('')
    })
  })

  describe('single words', () => {
    it('converts one word to each case', () => {
      expect(convertCase('Hello', { to: 'snake' })).toBe('hello')
      expect(convertCase('hello', { to: 'constant' })).toBe('HELLO')
      expect(convertCase('HELLO', { to: 'camel' })).toBe('hello')
      expect(convertCase('hello', { to: 'pascal' })).toBe('Hello')
      expect(convertCase('HELLO', { to: 'title' })).toBe('Hello')
    })
  })

  describe('more than two words', () => {
    it('applies the case to each word', () => {
      expect(convertCase('the quick brown fox', { to: 'camel' })).toBe('theQuickBrownFox')
      expect(convertCase('the quick brown fox', { to: 'ada' })).toBe('The_Quick_Brown_Fox')
      expect(convertCase('theQuickBrownFox', { to: 'kebab' })).toBe('the-quick-brown-fox')
    })
  })

  describe('known acronyms', () => {
    it('reads a known acronym as one word', () => {
      expect(convertCase('XMLHttpRequest', { to: 'snake' })).toBe('xml_http_request')
      expect(convertCase('parseJSON', { to: 'kebab' })).toBe('parse-json')
    })

    it('splits known acronyms that run together', () => {
      expect(convertCase('XMLHTTPRequest', { to: 'snake' })).toBe('xml_http_request')
    })

    it('writes a known acronym in capitals where a word starts with a capital', () => {
      expect(convertCase('xml_http_request', { to: 'pascal' })).toBe('XMLHTTPRequest')
      expect(convertCase('parse_json', { to: 'camel' })).toBe('parseJSON')
      expect(convertCase('user_id', { to: 'ada' })).toBe('User_ID')
      expect(convertCase('user id', { to: 'train' })).toBe('User-ID')
      expect(convertCase('get http response', { to: 'title' })).toBe('Get HTTP Response')
    })

    it('writes the first word of camel case in lowercase, even when it is an acronym', () => {
      expect(convertCase('JSON_PARSE', { to: 'camel' })).toBe('jsonParse')
    })

    it('writes a known acronym in the case of the other words in a lower or upper case', () => {
      expect(convertCase('parseJSON', { to: 'lower' })).toBe('parse json')
      expect(convertCase('parse_json', { to: 'constant' })).toBe('PARSE_JSON')
    })

    it.each(ConvertCaseAcronyms)('knows %s', (acronym) => {
      expect(convertCase(`a ${acronym.toLowerCase()}`, { to: 'pascal' })).toBe(`A${acronym}`)
    })
  })

  describe('more acronyms', () => {
    it('adds acronyms to the known acronyms, in any case', () => {
      expect(convertCase('my_gql_api', { to: 'camel', acronyms: ['gql'] })).toBe('myGQLAPI')
      expect(convertCase('myGQLAPI', { to: 'snake', acronyms: ['GQL'] })).toBe('my_gql_api')
    })

    it('does not know the added acronyms when they are not given', () => {
      expect(convertCase('my_gql_api', { to: 'camel' })).toBe('myGqlAPI')
      expect(convertCase('myGQLAPI', { to: 'snake' })).toBe('my_gqlapi')
    })

    it('keeps the built-in acronyms when acronyms are added', () => {
      expect(convertCase('parse_json', { to: 'camel', acronyms: ['GQL'] })).toBe('parseJSON')
    })

    it('ignores an empty acronym', () => {
      expect(convertCase('parse_json', { to: 'camel', acronyms: [''] })).toBe('parseJSON')
    })

    it('does not change the acronyms array', () => {
      const acronyms = Object.freeze(['gql'])
      convertCase('my_gql', { to: 'pascal', acronyms })
      expect(acronyms).toEqual(['gql'])
    })
  })

  describe('unknown acronyms', () => {
    it('keeps an unknown acronym together by default', () => {
      expect(convertCase('parseABCValue', { to: 'snake' })).toBe('parse_abc_value')
    })

    it('splits each capital of an unknown acronym when unknownAcronyms is split', () => {
      expect(convertCase('parseABCValue', { to: 'snake', unknownAcronyms: 'split' })).toBe(
        'parse_a_b_c_value',
      )
    })

    it('splits an unknown acronym that is shorter than minAcronymLength', () => {
      expect(convertCase('IOError', { to: 'snake' })).toBe('io_error')
      expect(convertCase('IOError', { to: 'snake', minAcronymLength: 3 })).toBe('i_o_error')
    })

    it('writes an unknown acronym like other words', () => {
      expect(convertCase('parseABCValue', { to: 'pascal' })).toBe('ParseAbcValue')
    })

    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
      'throws a RangeError when minAcronymLength is %s',
      (minAcronymLength) => {
        expect(() => convertCase('hello', { to: 'snake', minAcronymLength })).toThrow(
          new RangeError(
            `convertCase: minAcronymLength (${minAcronymLength}) must be an integer of 1 or more`,
          ),
        )
      },
    )

    it('accepts a minAcronymLength of 1', () => {
      expect(convertCase('IOError', { to: 'snake', minAcronymLength: 1 })).toBe('io_error')
    })
  })

  describe('digits', () => {
    it('keeps digits in the word before them by default', () => {
      expect(convertCase('base64Encode', { to: 'snake' })).toBe('base64_encode')
      expect(convertCase('base64_encode', { to: 'camel' })).toBe('base64Encode')
    })

    it('puts digits in the word after them when digits is right', () => {
      expect(convertCase('base64Encode', { to: 'snake', digits: 'right' })).toBe('base_64encode')
    })

    it('makes digits a word of their own when digits is separate', () => {
      expect(convertCase('base64Encode', { to: 'snake', digits: 'separate' })).toBe(
        'base_64_encode',
      )
    })

    it('leaves a word that starts with a digit as it is in title case', () => {
      expect(convertCase('3d model', { to: 'title' })).toBe('3d Model')
      expect(convertCase('3d model', { to: 'pascal' })).toBe('3dModel')
    })
  })

  describe('Unicode', () => {
    it('changes the case of letters outside ASCII', () => {
      expect(convertCase('crème brûlée', { to: 'pascal' })).toBe('CrèmeBrûlée')
      expect(convertCase('ÉCOLE_PRIMAIRE', { to: 'camel' })).toBe('écolePrimaire')
    })

    it('capitalises a letter outside the Basic Multilingual Plane', () => {
      // U+10428 is a lowercase Deseret letter. Its uppercase form is U+10400.
      expect(convertCase('\u{10428}x', { to: 'title' })).toBe('\u{10400}x')
    })

    it('uses the full uppercase mapping', () => {
      expect(convertCase('straße', { to: 'upper' })).toBe('STRASSE')
    })
  })

  it('does not change the input', () => {
    const input = 'hello world'
    convertCase(input, { to: 'constant' })
    expect(input).toBe('hello world')
  })

  it('accepts a frozen options object', () => {
    const options = Object.freeze({ to: 'kebab', digits: 'separate' } as const)
    expect(convertCase('helloWorld2', options)).toBe('hello-world-2')
    expect(options).toEqual({ to: 'kebab', digits: 'separate' })
  })

  it('uses the default for an option that is undefined', () => {
    expect(convertCase('base64Encode', { to: 'snake', digits: undefined })).toBe('base64_encode')
  })

  describe('unknown cases', () => {
    it('accepts only a known case at compile time', () => {
      expectTypeOf(convertCase).parameter(1).toEqualTypeOf<ConvertCaseOptions>()
      expectTypeOf<ConvertCaseOptions['to']>().toEqualTypeOf<ConvertCaseStyle>()
    })

    it('throws a TypeError that names the case', () => {
      // @ts-expect-error 'sponge' is not a case that convertCase can produce.
      expect(() => convertCase('hello', { to: 'sponge' })).toThrow(
        new TypeError('convertCase: "sponge" is not a case'),
      )
    })

    it('does not read a property of Object.prototype as a case', () => {
      // @ts-expect-error 'toString' is not a case that convertCase can produce.
      expect(() => convertCase('hello', { to: 'toString' })).toThrow(
        new TypeError('convertCase: "toString" is not a case'),
      )
    })

    it('throws for an unknown case even when the input is empty', () => {
      // @ts-expect-error 'sponge' is not a case that convertCase can produce.
      expect(() => convertCase('', { to: 'sponge' })).toThrow(TypeError)
    })
  })

  describe('option objects', () => {
    it('has a value in ConvertCaseStyle for each case', () => {
      expect(Object.values(ConvertCaseStyle).sort()).toEqual([...styles].sort())
    })

    it('accepts the values of the option objects', () => {
      expect(
        convertCase('parseABCValue64', {
          to: ConvertCaseStyle.kebab,
          unknownAcronyms: ConvertCaseUnknownAcronyms.split,
          digits: ConvertCaseDigits.separate,
        }),
      ).toBe('parse-a-b-c-value-64')
    })

    it('gives the same result for an option object value and its string', () => {
      expect(convertCase('helloWorld', { to: ConvertCaseStyle.snake })).toBe(
        convertCase('helloWorld', { to: 'snake' }),
      )
    })

    it('types each option as the values of its object', () => {
      expectTypeOf<ConvertCaseOptions['unknownAcronyms']>().toEqualTypeOf<
        'together' | 'split' | undefined
      >()
      expectTypeOf<ConvertCaseOptions['digits']>().toEqualTypeOf<
        'left' | 'right' | 'separate' | undefined
      >()
    })
  })

  describe('ConvertCaseFormats', () => {
    it('has a format for each case', () => {
      expect(Object.keys(ConvertCaseFormats).sort()).toEqual([...styles].sort())
    })

    it('writes the words the same way as convertCase', () => {
      for (const to of styles) {
        const { separator, word } = ConvertCaseFormats[to]
        const words = ['hello', 'world']
        expect(words.map((text, index) => word(text, index, false)).join(separator)).toBe(
          expected[to],
        )
      }
    })

    it('is frozen, so convertCase cannot be changed from outside', () => {
      expect(Object.isFrozen(ConvertCaseFormats)).toBe(true)
      for (const to of styles) expect(Object.isFrozen(ConvertCaseFormats[to])).toBe(true)
      expect(() => {
        // @ts-expect-error the formats are read-only.
        ConvertCaseFormats.snake = ConvertCaseFormats.kebab
      }).toThrow(TypeError)
      expect(convertCase('helloWorld', { to: 'snake' })).toBe('hello_world')
    })
  })

  describe('mixed input', () => {
    it('reads acronyms, digits and separators in one input', () => {
      const input = 'get HTTPResponse_code2-ForUser'
      expect(convertCase(input, { to: 'snake' })).toBe('get_http_response_code2_for_user')
      expect(convertCase(input, { to: 'camel' })).toBe('getHTTPResponseCode2ForUser')
      expect(convertCase(input, { to: 'title' })).toBe('Get HTTP Response Code2 For User')
    })

    it('gives the same result when the output is converted again', () => {
      for (const to of ['camel', 'pascal'] as const) {
        const once = convertCase('XMLHttpRequest', { to })
        expect(convertCase(once, { to })).toBe(once)
      }
    })

    it('converts between cases without losing words', () => {
      const kebab = convertCase('getHTTPResponse', { to: 'kebab' })
      const constant = convertCase(kebab, { to: 'constant' })
      expect(convertCase(constant, { to: 'camel' })).toBe('getHTTPResponse')
    })
  })

  it('matches each TSDoc example', () => {
    expect(convertCase('helloWorld', { to: 'snake' })).toBe('hello_world')
    expect(convertCase('hello world', { to: 'constant' })).toBe('HELLO_WORLD')
    expect(convertCase('hello world', { to: 'ada' })).toBe('Hello_World')
    expect(convertCase('HelloWorld', { to: 'kebab' })).toBe('hello-world')
    expect(convertCase('hello_world', { to: 'cobol' })).toBe('HELLO-WORLD')
    expect(convertCase('hello world', { to: 'train' })).toBe('Hello-World')
    expect(convertCase('Hello World', { to: 'flat' })).toBe('helloworld')
    expect(convertCase('hello-world', { to: 'upperFlat' })).toBe('HELLOWORLD')
    expect(convertCase('hello_world', { to: 'pascal' })).toBe('HelloWorld')
    expect(convertCase('HELLO_WORLD', { to: 'camel' })).toBe('helloWorld')
    expect(convertCase('helloWorld', { to: 'lower' })).toBe('hello world')
    expect(convertCase('helloWorld', { to: 'upper' })).toBe('HELLO WORLD')
    expect(convertCase('hello_world', { to: 'title' })).toBe('Hello World')
    expect(convertCase('', { to: 'camel' })).toBe('')
    expect(convertCase('XMLHTTPRequest', { to: 'snake' })).toBe('xml_http_request')
    expect(convertCase('xml_http_request', { to: 'pascal' })).toBe('XMLHTTPRequest')
    expect(convertCase('my_gql_api', { to: 'camel', acronyms: ['GQL'] })).toBe('myGQLAPI')
    expect(convertCase('parseABCValue', { to: 'snake', unknownAcronyms: 'split' })).toBe(
      'parse_a_b_c_value',
    )
    expect(convertCase('IOError', { to: 'snake', minAcronymLength: 3 })).toBe('i_o_error')
    expect(convertCase('base64Encode', { to: 'snake' })).toBe('base64_encode')
    expect(convertCase('base64Encode', { to: 'snake', digits: 'right' })).toBe('base_64encode')
    expect(convertCase('base64Encode', { to: 'snake', digits: 'separate' })).toBe('base_64_encode')
    expect(() => convertCase('hello', { to: 'snake', minAcronymLength: 0 })).toThrow(RangeError)
    expect(convertCase('helloWorld', { to: ConvertCaseStyle.snake })).toBe('hello_world')
    expect(
      convertCase('base64Encode', {
        to: ConvertCaseStyle.snake,
        digits: ConvertCaseDigits.separate,
      }),
    ).toBe('base_64_encode')
  })
})
