import { describe, expect, it } from 'vitest'
import { concatenate } from './concatenate'

describe('concatenate', () => {
  it('joins two arrays', () => {
    expect(concatenate([1, 2], [3])).toEqual([1, 2, 3])
  })

  it('returns an empty array for two empty arrays', () => {
    expect(concatenate([], [])).toEqual([])
  })

  it('removes a repeated value if unique is true', () => {
    expect(concatenate([1, 2], [2, 3], { unique: true })).toEqual([1, 2, 3])
  })

  it('does not change the input arrays', () => {
    const first = [1]
    const second = [2]
    concatenate(first, second)
    expect(first).toEqual([1])
    expect(second).toEqual([2])
  })
})
