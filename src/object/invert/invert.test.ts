import { describe, expect, it } from 'vitest'
import { invert } from './invert'

describe('invert', () => {
  it('handles the normal case', () => {
    expect(invert).toBeTypeOf('function')
  })

  it('handles the empty case', () => {
    expect.fail('write this test')
  })
})
