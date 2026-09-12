import { describe, expect, it } from 'vitest'
import { pick } from './pick'

describe('pick', () => {
  it('handles the normal case', () => {
    expect(pick).toBeTypeOf('function')
  })

  it('handles the empty case', () => {
    expect.fail('write this test')
  })
})
