import { describe, expect, it } from 'vitest'
import { toQueryString } from './to-query-string'

describe('toQueryString', () => {
  it('handles the normal case', () => {
    expect(toQueryString).toBeTypeOf('function')
  })

  it('handles the empty case', () => {
    expect.fail('write this test')
  })
})
