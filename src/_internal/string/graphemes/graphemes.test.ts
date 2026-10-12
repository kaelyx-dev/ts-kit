import { describe, expect, it } from 'vitest'
import { takeGraphemes } from './graphemes'

/** Yield `items` as segments, and throw if the caller reads more than `limit` of them. */
function* segmentsWithLimit(items: string[], limit: number): Generator<{ segment: string }> {
  for (const [i, segment] of items.entries()) {
    if (i >= limit) throw new Error(`read segment ${i + 1}, but the limit is ${limit}`)
    yield { segment }
  }
}

describe('takeGraphemes', () => {
  it('returns the first count segments as strings', () => {
    expect(takeGraphemes(segmentsWithLimit(['a', '😀', 'c', 'd'], 2), 2)).toEqual(['a', '😀'])
  })

  it('stops reading after count segments', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    expect(() => takeGraphemes(segmentsWithLimit(items, 3), 3)).not.toThrow()
    expect(() => takeGraphemes(segmentsWithLimit(items, 3), 4)).toThrow('read segment 4')
  })

  it('returns all of the segments when count is more than the number of segments', () => {
    expect(takeGraphemes(segmentsWithLimit(['a', 'b'], 2), 5)).toEqual(['a', 'b'])
  })

  it('reads no segment when count is 0', () => {
    expect(takeGraphemes(segmentsWithLimit(['a', 'b'], 0), 0)).toEqual([])
  })

  it('reads graphemes from an Intl.Segmenter', () => {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    expect(takeGraphemes(segmenter.segment('👨‍👩‍👧 café'), 5)).toEqual([
      '👨‍👩‍👧',
      ' ',
      'c',
      'a',
      'f',
    ])
  })
})
