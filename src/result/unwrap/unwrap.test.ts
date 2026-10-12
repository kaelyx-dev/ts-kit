import { describe, expect, it } from 'vitest'
import { err } from '../err/err'
import { ok } from '../ok/ok'
import { unwrap } from './unwrap'

describe('unwrap', () => {
  it('returns the value of a successful result', () => {
    expect(unwrap(ok(42))).toBe(42)
  })

  it.each([undefined, null, '', 0, false])('returns the falsy value %s', (value) => {
    expect(unwrap(ok(value))).toBe(value)
  })

  it('throws for a failed result', () => {
    expect(() => unwrap(err('Something went wrong'))).toThrow('Attempted to unwrap an Err result')
  })

  it('attaches the original error as the cause', () => {
    const error = new Error('Boom')
    try {
      unwrap(err(error))
      expect.unreachable()
    } catch (thrown) {
      expect((thrown as Error).cause).toBe(error)
    }
  })
})
