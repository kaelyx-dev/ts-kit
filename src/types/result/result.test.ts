import { describe, expect, expectTypeOf, it } from 'vitest'
import type { Result } from './result.types'

// expectTypeOf is checked by "npm run typecheck", not at run time.
describe('Result', () => {
  it('should allow a successful result', () => {
    const result: Result<number, string> = { ok: true, value: 42 }
    expect(result.ok).toBe(true)
    expect(result.value).toBe(42)
  })

  it('should allow a failed result', () => {
    const result: Result<number, string> = { ok: false, error: 'Something went wrong' }
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Something went wrong')
  })

  it('should have the correct type for a successful result', () => {
    const result: Result<number, string> = { ok: true, value: 42 }
    expectTypeOf(result).toMatchTypeOf<Result<number, string>>()
  })

  it('should have the correct type for a failed result', () => {
    const result: Result<number, SyntaxError> = {
      ok: false,
      error: new SyntaxError('Something went wrong'),
    }
    expectTypeOf(result).toMatchTypeOf<Result<number, SyntaxError>>()
  })
})
