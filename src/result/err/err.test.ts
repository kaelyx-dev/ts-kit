import { describe, expect, it } from 'vitest'
import { err } from './err'

describe('err', () => {
  it('handles the normal case', () => {
    expect(err).toBeTypeOf('function')
  })

  it('handles the empty case', () => {
    expect.fail('write this test')
  })
})
