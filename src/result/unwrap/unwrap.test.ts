import { describe, expect, it } from 'vitest'
import { unwrap } from './unwrap'

describe('unwrap', () => {
  it('handles the normal case', () => {
    expect(unwrap).toBeTypeOf('function')
  })

  it('handles the empty case', () => {
    expect.fail('write this test')
  })
})
