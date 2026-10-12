import { describe, expect, expectTypeOf, it } from 'vitest'
import { parseJson } from './parse-json'

describe('parseJson', () => {
  it('should parse a valid JSON string successfully', () => {
    const result = parseJson('{"key": "value"}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ key: 'value' })
    }
  })

  it('should return an error for an invalid JSON string', () => {
    const result = parseJson('invalid json')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(SyntaxError)
    }
  })

  it('should return an error for an empty JSON string', () => {
    const result = parseJson('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(SyntaxError)
    }
  })

  it('should parse a non-string input that JSON.parse coerces to valid JSON text', () => {
    // @ts-expect-error testing non-string input
    const result = parseJson(123)
    expect(result).toEqual({ ok: true, value: 123 })
  })

  it('should return an error for a non-string input that coerces to invalid JSON text', () => {
    // @ts-expect-error testing non-string input
    const result = parseJson({})
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(SyntaxError)
    }
  })

  // RFC 8259: a JSON text can be any serialised value, not only an object or array.
  it.each([
    ['null', null],
    ['true', true],
    ['false', false],
    ['0', 0],
    ['-3.5', -3.5],
    ['1.5e3', 1500],
    ['"text"', 'text'],
    ['[]', []],
    ['{}', {}],
  ])('should parse the top-level JSON value %s', (input, value) => {
    expect(parseJson(input)).toEqual({ ok: true, value })
  })

  it('should allow insignificant whitespace around valid JSON', () => {
    expect(parseJson('  \n\t{"value":1}  ')).toEqual({ ok: true, value: { value: 1 } })
  })

  it('should parse a double-encoded JSON document only once', () => {
    const encodedJson = JSON.stringify(JSON.stringify({ nested: true }))
    expect(parseJson(encodedJson)).toEqual({ ok: true, value: '{"nested":true}' })
  })

  it('should use the supplied generic type for the parsed value', () => {
    const result = parseJson<{ id: number }>('{"id": 7}')
    expect(result).toEqual({ ok: true, value: { id: 7 } })
    if (result.ok) {
      expectTypeOf(result.value).toEqualTypeOf<{ id: number }>()
    }
  })

  it('should return an error for a JSON string with trailing comma', () => {
    const result = parseJson('{"key": "value",}')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(SyntaxError)
    }
  })

  it('should rethrow errors that are not a SyntaxError', () => {
    // @ts-expect-error testing non-string input that cannot be coerced to a string
    expect(() => parseJson(Symbol('not json'))).toThrow(TypeError)
  })
})
