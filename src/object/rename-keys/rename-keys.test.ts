import { describe, expect, it } from 'vitest'
import { renameKeys } from './rename-keys'

describe('renameKeys', () => {
  it('handles the normal case', () => {
    expect(renameKeys).toBeTypeOf('function')
  })

  it('handles the empty case', () => {
    expect.fail('write this test')
  })
})
