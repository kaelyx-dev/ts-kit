import { describe, expect, it } from 'vitest'
import { err } from './err'

describe('err', () => {
  it('wraps the error in a failed result', () => {
    expect(err('Something went wrong')).toEqual({ ok: false, error: 'Something went wrong' })
  })

  it('keeps the same error instance', () => {
    const error = new Error('Boom')
    const result = err(error)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toBe(error)
  })

  it.each([undefined, null, '', 0, false])('keeps the falsy error %s', (error) => {
    expect(err(error)).toEqual({ ok: false, error })
  })
})
