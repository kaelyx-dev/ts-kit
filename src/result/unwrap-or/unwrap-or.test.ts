import { describe, expect, it } from 'vitest'
import { err } from '../err/err'
import { ok } from '../ok/ok'
import { unwrapOr } from './unwrap-or'

describe('unwrapOr', () => {
  it('returns the value of a successful result', () => {
    expect(unwrapOr(ok(42), 0)).toBe(42)
  })

  it('returns the default value for a failed result', () => {
    expect(unwrapOr<number, string>(err('Something went wrong'), 0)).toBe(0)
  })

  it.each([undefined, null, '', 0, false])(
    'returns the falsy value %s instead of the default',
    (value) => {
      expect(unwrapOr<unknown, never>(ok(value), 'default')).toBe(value)
    },
  )
})
