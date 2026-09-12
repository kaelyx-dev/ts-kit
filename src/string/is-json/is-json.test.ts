import { describe, expect, it } from 'vitest'
import { isJson } from './is-json'

describe('isJson', () => {
  it('parses a JSON object', () => {
    expect(isJson('{"name":"Ada","active":true}')).toEqual({
      valid: true,
      data: { name: 'Ada', active: true },
    })
  })

  it.each([
    ['null', null],
    ['true', true],
    ['false', false],
    ['0', 0],
    ['-0', -0],
    ['42', 42],
    ['-3.5', -3.5],
    ['1.5e3', 1500],
    ['"text"', 'text'],
    ['[]', []],
    ['{}', {}],
  ])('parses valid JSON value %s', (input, data) => {
    expect(isJson(input)).toEqual({ valid: true, data })
  })

  it('allows insignificant whitespace around valid JSON', () => {
    expect(isJson('  \n\t{"value":1}  ')).toEqual({
      valid: true,
      data: { value: 1 },
    })
  })

  it('parses escaped characters and unicode', () => {
    expect(isJson('"line\\n\\u2603"')).toEqual({
      valid: true,
      data: 'line\n☃',
    })
  })

  it('treats a double-encoded JSON document as a JSON string', () => {
    const encodedJson = JSON.stringify(JSON.stringify({ nested: true }))

    expect(isJson(encodedJson)).toEqual({
      valid: true,
      data: '{"nested":true}',
    })
  })

  it('does not parse the inner document a second time', () => {
    const encodedJson = JSON.stringify(JSON.stringify({ nested: true }))
    const result = isJson(encodedJson)

    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(typeof result.data).toBe('string')
      expect(result.data).not.toEqual({ nested: true })
    }
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
  ])('returns an invalid result for %j', (input) => {
    const result = isJson(input)

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toBeInstanceOf(SyntaxError)
    }
  })

  it('does not throw for invalid JSON', () => {
    expect(() => isJson('{"unterminated": true')).not.toThrow()
  })

  it('preserves JSON.parse number boundary behavior', () => {
    expect(isJson('1e308')).toEqual({ valid: true, data: 1e308 })
    expect(isJson('1e309')).toEqual({ valid: true, data: Number.POSITIVE_INFINITY })
  })

  it('uses the supplied generic type for parsed data', () => {
    const result = isJson<{ id: number }>(' {"id": 7} ')

    expect(result).toEqual({ valid: true, data: { id: 7 } })
  })
})
