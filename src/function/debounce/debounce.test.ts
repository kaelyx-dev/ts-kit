import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { debounce } from './debounce'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('debounce', () => {
  describe('calls', () => {
    it('runs fn once with the latest arguments after the wait', () => {
      const fn = vi.fn((_a: string, _b: number) => {})
      const debounced = debounce(fn, { debounceMs: 100 })

      debounced('a', 1)
      debounced('b', 2)
      vi.advanceTimersByTime(99)
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(fn).toHaveBeenCalledOnce()
      expect(fn).toHaveBeenCalledWith('b', 2)
    })

    it('restarts the wait on each call', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, { debounceMs: 100 })

      debounced()
      vi.advanceTimersByTime(60)
      debounced()
      vi.advanceTimersByTime(60)
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(40)
      expect(fn).toHaveBeenCalledOnce()
    })

    it('runs again for a call made after the wait has passed', () => {
      const fn = vi.fn((_value: string) => {})
      const debounced = debounce(fn, { debounceMs: 100 })

      debounced('a')
      vi.advanceTimersByTime(100)
      debounced('b')
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenNthCalledWith(1, 'a')
      expect(fn).toHaveBeenNthCalledWith(2, 'b')
    })

    it('runs a function that takes no arguments', () => {
      const fn = vi.fn()
      debounce(fn, { debounceMs: 100 })()

      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledWith()
    })

    it('waits for the next timer tick when no options are given', () => {
      const fn = vi.fn()
      const debounced = debounce(fn)

      debounced()
      debounced()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(0)
      expect(fn).toHaveBeenCalledOnce()
    })

    it('uses the default delay when debounceMs is undefined', () => {
      const fn = vi.fn()
      debounce(fn, { debounceMs: undefined })()

      vi.advanceTimersByTime(0)

      expect(fn).toHaveBeenCalledOnce()
    })

    it('keeps the state of each handler separate', () => {
      const fn = vi.fn((_value: string) => {})
      const first = debounce(fn, { debounceMs: 100 })
      const second = debounce(fn, { debounceMs: 100 })

      first('a')
      second('b')
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('cancel', () => {
    it('stops a waiting call', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, { debounceMs: 100 })

      debounced()
      debounced.cancel()
      vi.advanceTimersByTime(100)

      expect(fn).not.toHaveBeenCalled()
    })

    it('does nothing when no call is waiting', () => {
      const debounced = debounce(vi.fn(), { debounceMs: 100 })

      expect(() => debounced.cancel()).not.toThrow()
    })

    it('does not stop later calls', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, { debounceMs: 100 })

      debounced()
      debounced.cancel()
      debounced()
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledOnce()
    })
  })

  describe('flush', () => {
    it('runs a waiting call immediately with the latest arguments, and only once', () => {
      const fn = vi.fn((_value: string) => {})
      const debounced = debounce(fn, { debounceMs: 100 })

      debounced('a')
      debounced('b')
      debounced.flush()
      expect(fn).toHaveBeenCalledOnce()
      expect(fn).toHaveBeenCalledWith('b')

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledOnce()
    })

    it('runs a waiting call that has no arguments', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, { debounceMs: 100 })

      debounced()
      debounced.flush()

      expect(fn).toHaveBeenCalledOnce()
    })

    it('does nothing when no call is waiting', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, { debounceMs: 100 })

      debounced.flush()
      debounced()
      vi.advanceTimersByTime(100)
      debounced.flush()

      expect(fn).toHaveBeenCalledOnce()
    })

    it('throws the error from fn', () => {
      const error = new Error('failed')
      const debounced = debounce(
        () => {
          throw error
        },
        { debounceMs: 100 },
      )

      debounced()

      expect(() => debounced.flush()).toThrow(error)
    })
  })

  describe('types', () => {
    it('takes the argument types from fn and returns void', () => {
      const debounced = debounce((value: string, count: number) => value.repeat(count), {
        debounceMs: 100,
      })

      expectTypeOf(debounced).parameters.toEqualTypeOf<[string, number]>()
      expectTypeOf(debounced).returns.toEqualTypeOf<void>()
    })
  })
})
