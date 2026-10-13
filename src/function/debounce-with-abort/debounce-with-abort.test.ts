import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { debounceWithAbort } from './debounce-with-abort'

interface ControlledCall<R> {
  signal: AbortSignal
  resolve: (value: R) => void
  reject: (error: unknown) => void
}

/** A fake async function. Each call stays in flight until the test resolves or rejects it. */
const controllable = <A extends unknown[], R>() => {
  const calls: ControlledCall<R>[] = []
  const fn = vi.fn(
    (signal: AbortSignal, ..._args: A) =>
      new Promise<R>((resolve, reject) => {
        calls.push({ signal, resolve, reject })
      }),
  )
  const call = (index: number): ControlledCall<R> => {
    const found = calls[index]
    if (!found) throw new Error(`fn was not called ${index + 1} times`)
    return found
  }
  return { fn, call }
}

const abortError = (): Error => Object.assign(new Error('aborted'), { name: 'AbortError' })

/** Runs pending promise callbacks. */
const settle = () => vi.advanceTimersByTimeAsync(0)

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('debounceWithAbort', () => {
  describe('without a delay', () => {
    it('calls fn immediately with a signal and the arguments, and resolves with the result', async () => {
      const fn = vi.fn(async (_signal: AbortSignal, a: number, b: number) => a + b)
      const handler = debounceWithAbort(fn)

      const promise = handler(1, 2)

      expect(fn).toHaveBeenCalledOnce()
      expect(fn).toHaveBeenCalledWith(expect.any(AbortSignal), 1, 2)
      await expect(promise).resolves.toBe(3)
    })

    it('runs immediately when debounceMs is less than 0', () => {
      const { fn } = controllable<[], string>()
      debounceWithAbort(fn, { debounceMs: -1 })()

      expect(fn).toHaveBeenCalledOnce()
    })

    it('is pending while a call is in flight, and not pending once the caller has the result', async () => {
      const { fn, call } = controllable<[], string>()
      const handler = debounceWithAbort(fn)
      expect(handler.pending).toBe(false)

      const promise = handler()
      expect(handler.pending).toBe(true)

      call(0).resolve('done')
      await promise
      expect(handler.pending).toBe(false)
    })

    it('aborts the previous call and resolves it to undefined', async () => {
      const { fn, call } = controllable<[string], string>()
      const onSuccess = vi.fn()
      const handler = debounceWithAbort(fn, { onSuccess })

      const first = handler('a')
      const second = handler('b')

      expect(call(0).signal.aborted).toBe(true)
      expect(call(1).signal.aborted).toBe(false)
      await expect(first).resolves.toBeUndefined()

      call(1).resolve('B')
      await expect(second).resolves.toBe('B')
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(onSuccess).toHaveBeenCalledWith('B', 'b')
    })

    it('discards a stale result when fn ignores the signal', async () => {
      const { fn, call } = controllable<[string], string>()
      const onSuccess = vi.fn()
      const handler = debounceWithAbort(fn, { onSuccess })

      const first = handler('a')
      handler('b')
      call(0).resolve('A')

      await expect(first).resolves.toBeUndefined()
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('does not report an error from a superseded call', async () => {
      const { fn, call } = controllable<[string], string>()
      const onError = vi.fn()
      const handler = debounceWithAbort(fn, { onError })

      const first = handler('a')
      handler('b')
      call(0).reject(new Error('late failure'))
      await settle()

      await expect(first).resolves.toBeUndefined()
      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe('errors', () => {
    it('rejects with the error when onError is not set', async () => {
      const { fn, call } = controllable<[], string>()
      const promise = debounceWithAbort(fn)()
      const error = new Error('failed')

      call(0).reject(error)

      await expect(promise).rejects.toBe(error)
    })

    it('passes the error and the arguments to onError, and resolves to undefined', async () => {
      const { fn, call } = controllable<[string], string>()
      const onError = vi.fn()
      const promise = debounceWithAbort(fn, { onError })('a')
      const error = new Error('failed')

      call(0).reject(error)

      await expect(promise).resolves.toBeUndefined()
      expect(onError).toHaveBeenCalledWith(error, 'a')
    })

    it('rejects with the error from onError when onError throws', async () => {
      const { fn, call } = controllable<[], string>()
      const handlerError = new Error('handler failed')
      const promise = debounceWithAbort(fn, {
        onError: () => {
          throw handlerError
        },
      })()

      call(0).reject(new Error('failed'))

      await expect(promise).rejects.toBe(handlerError)
    })

    it('treats a synchronous throw from fn as a rejection', async () => {
      const error = new Error('sync failure')
      const fn = (): Promise<string> => {
        throw error
      }

      await expect(debounceWithAbort(fn)()).rejects.toBe(error)
    })

    it('passes an error from onSuccess to onError', async () => {
      const error = new Error('onSuccess failed')
      const onError = vi.fn()
      const promise = debounceWithAbort(async () => 'value', {
        onSuccess: () => {
          throw error
        },
        onError,
      })()

      await expect(promise).resolves.toBeUndefined()
      expect(onError).toHaveBeenCalledWith(error)
    })

    it('rejects with an error from onSuccess when onError is not set', async () => {
      const error = new Error('onSuccess failed')
      const promise = debounceWithAbort(async () => 'value', {
        onSuccess: () => {
          throw error
        },
      })()

      await expect(promise).rejects.toBe(error)
    })

    it('resolves to undefined when fn rejects with an AbortError', async () => {
      const { fn, call } = controllable<[], string>()
      const onError = vi.fn()
      const promise = debounceWithAbort(fn, { onError })()

      call(0).reject(abortError())

      await expect(promise).resolves.toBeUndefined()
      expect(onError).not.toHaveBeenCalled()
    })

    it.each([
      ['a string', 'failed'],
      ['null', null],
      ['an object without a name', {}],
      ['an error with another name', new TypeError('failed')],
    ])('reports %s as a real error', async (_label, error) => {
      const { fn, call } = controllable<[], string>()
      const onError = vi.fn()
      const promise = debounceWithAbort(fn, { onError })()

      call(0).reject(error)

      await expect(promise).resolves.toBeUndefined()
      expect(onError).toHaveBeenCalledWith(error)
    })
  })

  describe('with a delay', () => {
    it('runs only the last call after the delay, and resolves earlier calls to undefined', async () => {
      const { fn, call } = controllable<[string], string>()
      const handler = debounceWithAbort(fn, { debounceMs: 100 })

      const first = handler('a')
      await vi.advanceTimersByTimeAsync(50)
      const second = handler('b')
      await expect(first).resolves.toBeUndefined()

      await vi.advanceTimersByTimeAsync(99)
      expect(fn).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1)
      expect(fn).toHaveBeenCalledOnce()
      expect(fn).toHaveBeenCalledWith(expect.any(AbortSignal), 'b')

      call(0).resolve('B')
      await expect(second).resolves.toBe('B')
    })

    it('is pending while a call waits on its timer', () => {
      const { fn } = controllable<[], string>()
      const handler = debounceWithAbort(fn, { debounceMs: 100 })

      handler()

      expect(handler.pending).toBe(true)
      expect(fn).not.toHaveBeenCalled()
    })

    it('cancel stops a waiting call and resolves it to undefined', async () => {
      const { fn } = controllable<[], string>()
      const handler = debounceWithAbort(fn, { debounceMs: 100 })

      const promise = handler()
      handler.cancel()

      expect(handler.pending).toBe(false)
      await expect(promise).resolves.toBeUndefined()
      await vi.advanceTimersByTimeAsync(100)
      expect(fn).not.toHaveBeenCalled()
    })

    it('cancel aborts a call in flight and resolves it to undefined', async () => {
      const { fn, call } = controllable<[], string>()
      const handler = debounceWithAbort(fn, { debounceMs: 100 })

      const promise = handler()
      await vi.advanceTimersByTimeAsync(100)
      handler.cancel()

      expect(call(0).signal.aborted).toBe(true)
      expect(handler.pending).toBe(false)
      await expect(promise).resolves.toBeUndefined()
    })

    it('cancel does nothing when no call is pending', () => {
      const handler = debounceWithAbort(async () => 'value', { debounceMs: 100 })

      expect(() => handler.cancel()).not.toThrow()
      expect(handler.pending).toBe(false)
    })

    it('flush runs a waiting call immediately and returns its promise', async () => {
      const { fn, call } = controllable<[string], string>()
      const handler = debounceWithAbort(fn, { debounceMs: 100 })

      const promise = handler('a')
      const flushed = handler.flush()

      expect(flushed).toBe(promise)
      expect(fn).toHaveBeenCalledOnce()
      call(0).resolve('A')
      await expect(flushed).resolves.toBe('A')

      await vi.advanceTimersByTimeAsync(100)
      expect(fn).toHaveBeenCalledOnce()
    })

    it('flush resolves to undefined when no call is pending', async () => {
      const handler = debounceWithAbort(async () => 'value', { debounceMs: 100 })

      await expect(handler.flush()).resolves.toBeUndefined()
    })

    it('flush resolves to undefined and does not run fn again when a call is already in flight', async () => {
      const { fn } = controllable<[], string>()
      const handler = debounceWithAbort(fn)

      handler()

      await expect(handler.flush()).resolves.toBeUndefined()
      expect(fn).toHaveBeenCalledOnce()
    })
  })

  describe('shouldRun', () => {
    it('skips a call when it returns false, but still cancels the earlier call', async () => {
      const { fn, call } = controllable<[string], string>()
      const shouldRun = vi.fn((query: string) => query.length > 2)
      const handler = debounceWithAbort(fn, { shouldRun })

      const first = handler('abc')
      const second = handler('ab')

      expect(shouldRun).toHaveBeenLastCalledWith('ab')
      expect(fn).toHaveBeenCalledOnce()
      expect(call(0).signal.aborted).toBe(true)
      await expect(first).resolves.toBeUndefined()
      await expect(second).resolves.toBeUndefined()
    })
  })

  describe('parent signal', () => {
    it('cancels a waiting call when the parent aborts, and disables the handler', async () => {
      const { fn } = controllable<[], string>()
      const parent = new AbortController()
      const handler = debounceWithAbort(fn, { debounceMs: 100, signal: parent.signal })

      const promise = handler()
      parent.abort()

      await expect(promise).resolves.toBeUndefined()
      await expect(handler()).resolves.toBeUndefined()
      await vi.advanceTimersByTimeAsync(100)
      expect(fn).not.toHaveBeenCalled()
    })

    it('aborts a call in flight when the parent aborts', async () => {
      const { fn, call } = controllable<[], string>()
      const parent = new AbortController()
      const promise = debounceWithAbort(fn, { signal: parent.signal })()

      parent.abort()

      expect(call(0).signal.aborted).toBe(true)
      await expect(promise).resolves.toBeUndefined()
    })

    it('does not run fn when the parent is already aborted', async () => {
      const { fn } = controllable<[], string>()
      const handler = debounceWithAbort(fn, { signal: AbortSignal.abort() })

      await expect(handler()).resolves.toBeUndefined()
      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe('a superseded call that finishes late', () => {
    it('does not clear the state of the newer call in flight', async () => {
      const { fn, call } = controllable<[string], string>()
      const handler = debounceWithAbort(fn)

      handler('a')
      handler('b')
      call(0).resolve('A')
      await settle()

      expect(handler.pending).toBe(true)
      handler.cancel()
      expect(call(1).signal.aborted).toBe(true)
    })

    it('does not stop cancel from settling the newer waiting call', async () => {
      const { fn, call } = controllable<[string], string>()
      const handler = debounceWithAbort(fn, { debounceMs: 100 })

      handler('a')
      await vi.advanceTimersByTimeAsync(100)
      const second = handler('b')
      call(0).resolve('A')
      await settle()

      handler.cancel()
      await expect(second).resolves.toBeUndefined()
    })
  })

  describe('types', () => {
    it('infers the argument and result types from fn', () => {
      const handler = debounceWithAbort(
        async (_signal: AbortSignal, query: string, limit: number) => query.length + limit,
        {
          shouldRun: (query, limit) => {
            expectTypeOf(query).toEqualTypeOf<string>()
            expectTypeOf(limit).toEqualTypeOf<number>()
            return true
          },
          onSuccess: (result, query) => {
            expectTypeOf(result).toEqualTypeOf<number>()
            expectTypeOf(query).toEqualTypeOf<string>()
          },
        },
      )

      expectTypeOf(handler).parameters.toEqualTypeOf<[string, number]>()
      expectTypeOf(handler).returns.toEqualTypeOf<Promise<number | undefined>>()
      expectTypeOf(handler.flush).returns.toEqualTypeOf<Promise<number | undefined>>()
    })
  })
})
