import { describe, expect, it } from 'vitest'
import { unwrapOr } from './unwrap-or'

describe('unwrapOr', () => {
  it('handles the normal case', () => {
    expect(unwrapOr).toBeTypeOf('function')
  })

  it('handles the empty case', () => {
    expect.fail('write this test')
  })
})
