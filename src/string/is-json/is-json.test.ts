import { describe, expect, it } from 'vitest'
import { isJson } from './is-json'

describe('isJson', () => {
  it('returns true for a JSON object', () => {
    expect(isJson('{"name":"Ada","active":true}')).toBe(true)
  })

  it.each(['null', 'true', 'false', '0', '-0', '42', '-3.5', '1.5e3', '"text"', '[]', '{}'])(
    'returns true for valid JSON value %s',
    (input) => {
      expect(isJson(input)).toBe(true)
    },
  )

  it('allows insignificant whitespace around valid JSON', () => {
    expect(isJson('  \n\t{"value":1}  ')).toBe(true)
  })

  it('accepts escaped characters and unicode', () => {
    expect(isJson('"line\\n\\u2603"')).toBe(true)
  })

  it('treats a double-encoded JSON document as valid JSON', () => {
    const encodedJson = JSON.stringify(JSON.stringify({ nested: true }))

    expect(isJson(encodedJson)).toBe(true)
  })

  it.each([
    '',
    '   ',
    '{',
    '{"key":}',
    '[1,]',
    'undefined',
    'NaN',
    'Infinity',
    "'text'",
    '{"key":1} trailing',
  ])('returns false for %j', (input) => {
    expect(isJson(input)).toBe(false)
  })

  it('does not throw for invalid JSON', () => {
    expect(() => isJson('{"unterminated": true')).not.toThrow()
  })

  it('returns true at the JSON.parse number boundary', () => {
    expect(isJson('1e308')).toBe(true)
    expect(isJson('1e309')).toBe(true)
  })
})
