import { describe, expect, it } from 'vitest'
import { ok } from './ok'

describe('ok', () => {
  it('handles the normal case', () => {
    expect(ok).toBeTypeOf('function')
  })

  it('handles the empty case', () => {
    expect.fail('write this test')
  })
})
