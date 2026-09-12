import { describe, expect, it } from 'vitest'
import { isJson } from './is-json'

describe('isJson', () => {
  it('handles the normal case', () => {
    expect(isJson).toBeTypeOf('function')
  })

  it('handles the empty case', () => {
    expect.fail('write this test')
  })
})
