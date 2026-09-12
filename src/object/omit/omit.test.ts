import { describe, expect, it } from 'vitest'
import { omit } from './omit'

describe('omit', () => {
  it('handles the normal case', () => {
    expect(omit).toBeTypeOf('function')
  })

  it('handles the empty case', () => {
    expect.fail('write this test')
  })
})
