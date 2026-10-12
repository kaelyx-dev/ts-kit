import { describe, expect, it } from 'vitest'
import { ok } from './ok'

describe('ok', () => {
  it('wraps the value in a successful result', () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 })
  })

  it('keeps the same object reference', () => {
    const value = { name: 'John' }
    const result = ok(value)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toBe(value)
  })

  it.each([undefined, null, '', 0, false])('keeps the falsy value %s', (value) => {
    expect(ok(value)).toEqual({ ok: true, value })
  })
})
