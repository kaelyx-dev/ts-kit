import { describe, expect, it } from 'vitest'
import { fromQueryString } from './from-query-string'

describe('fromQueryString', () => {
  it('handles the normal case', () => {
    expect(fromQueryString).toBeTypeOf('function')
  })

  it('handles the empty case', () => {
    expect.fail('write this test')
  })
})
