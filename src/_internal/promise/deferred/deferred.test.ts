import { describe, expect, it } from 'vitest'
import { createDeferred } from './deferred'

describe('createDeferred', () => {
  it('resolves the promise with the value passed to resolve', async () => {
    const deferred = createDeferred<string>()
    deferred.resolve('done')
    await expect(deferred.promise).resolves.toBe('done')
  })

  it('rejects the promise with the reason passed to reject', async () => {
    const deferred = createDeferred<string>()
    const error = new Error('failed')
    deferred.reject(error)
    await expect(deferred.promise).rejects.toBe(error)
  })

  it('keeps the first outcome when it is settled more than once', async () => {
    const deferred = createDeferred<string>()
    deferred.resolve('first')
    deferred.resolve('second')
    deferred.reject(new Error('late'))
    await expect(deferred.promise).resolves.toBe('first')
  })
})
