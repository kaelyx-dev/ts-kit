import { describe, expect, it } from 'vitest'
import { clamp } from './clamp'
import { type ClampOptions, ClampUndefinedBehaviour } from './clamp.types'

describe('clamp', () => {
  const bounds = { min: 1, max: 10 } as const

  describe('values within the bounds', () => {
    it('returns the input when it is between min and max', () => {
      expect(clamp(5, bounds)).toBe(5)
      expect(clamp(5.5, bounds)).toBe(5.5)
    })

    it('works with negative bounds', () => {
      expect(clamp(-5, { min: -10, max: -1 })).toBe(-5)
      expect(clamp(0, { min: -10, max: 10 })).toBe(0)
    })
  })

  describe('values outside the bounds', () => {
    it('returns min when the input is below min', () => {
      expect(clamp(-3, bounds)).toBe(1)
      expect(clamp(0, bounds)).toBe(1)
    })

    it('returns max when the input is above max', () => {
      expect(clamp(15, bounds)).toBe(10)
      expect(clamp(10.0001, bounds)).toBe(10)
    })

    it('clamps Infinity and -Infinity to the bounds', () => {
      expect(clamp(Number.POSITIVE_INFINITY, bounds)).toBe(10)
      expect(clamp(Number.NEGATIVE_INFINITY, bounds)).toBe(1)
    })
  })

  describe('boundaries', () => {
    it('returns the input when it is equal to min', () => {
      expect(clamp(1, bounds)).toBe(1)
    })

    it('returns the input when it is equal to max', () => {
      expect(clamp(10, bounds)).toBe(10)
    })

    it('clamps values just outside the bounds', () => {
      expect(clamp(1 - Number.EPSILON, bounds)).toBe(1)
      expect(clamp(10 + 10 * Number.EPSILON, bounds)).toBe(10)
    })

    it('keeps values just inside the bounds', () => {
      expect(clamp(1 + Number.EPSILON, bounds)).toBe(1 + Number.EPSILON)
      expect(clamp(10 - 10 * Number.EPSILON, bounds)).toBe(10 - 10 * Number.EPSILON)
    })

    it('returns the single allowed value when min equals max', () => {
      expect(clamp(-5, { min: 3, max: 3 })).toBe(3)
      expect(clamp(3, { min: 3, max: 3 })).toBe(3)
      expect(clamp(5, { min: 3, max: 3 })).toBe(3)
    })

    it('accepts infinite bounds', () => {
      const unbounded = { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY }
      expect(clamp(-1e308, unbounded)).toBe(-1e308)
      expect(clamp(1e308, unbounded)).toBe(1e308)
      expect(clamp(Number.POSITIVE_INFINITY, unbounded)).toBe(Number.POSITIVE_INFINITY)
    })

    it('handles the largest and smallest safe integers', () => {
      const safe = { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }
      expect(clamp(Number.MAX_SAFE_INTEGER, safe)).toBe(Number.MAX_SAFE_INTEGER)
      expect(clamp(Number.MIN_SAFE_INTEGER, safe)).toBe(Number.MIN_SAFE_INTEGER)
      expect(clamp(Number.MAX_VALUE, safe)).toBe(Number.MAX_SAFE_INTEGER)
      expect(clamp(-Number.MAX_VALUE, safe)).toBe(Number.MIN_SAFE_INTEGER)
    })

    it('treats -0 and 0 as within a bound of 0', () => {
      expect(clamp(-0, { min: 0, max: 1 })).toBe(0)
      expect(clamp(0, { min: -1, max: 0 })).toBe(0)
    })
  })

  describe('inverted bounds', () => {
    it('throws a RangeError when min is greater than max', () => {
      expect(() => clamp(5, { min: 10, max: 1 })).toThrow(RangeError)
      expect(() => clamp(5, { min: 10, max: 1 })).toThrow(
        'clamp: min (10) must not be greater than max (1)',
      )
      expect(() => clamp(5, { min: 1 + Number.EPSILON, max: 1 })).toThrow(RangeError)
    })

    it('throws even when strict is true', () => {
      expect(() => clamp(Number.NaN, { min: 10, max: 1, strict: true })).toThrow(RangeError)
    })

    it('throws when a default bound is crossed by the other bound', () => {
      const minOnly = { min: Number.POSITIVE_INFINITY, max: undefined } as unknown as ClampOptions
      const maxOnly = { min: undefined, max: Number.NEGATIVE_INFINITY } as unknown as ClampOptions
      expect(() => clamp(5, minOnly)).toThrow(RangeError)
      expect(() => clamp(5, maxOnly)).toThrow(RangeError)
    })
  })

  describe('defaults', () => {
    it('uses Number.MAX_VALUE as the upper bound when max is undefined', () => {
      const options = { min: 0, max: undefined } as unknown as ClampOptions
      expect(clamp(Number.POSITIVE_INFINITY, options)).toBe(Number.MAX_VALUE)
      expect(clamp(Number.MAX_VALUE, options)).toBe(Number.MAX_VALUE)
    })

    it('uses -Number.MAX_VALUE as the lower bound when min is undefined', () => {
      const options = { min: undefined, max: 10 } as unknown as ClampOptions
      expect(clamp(Number.NEGATIVE_INFINITY, options)).toBe(-Number.MAX_VALUE)
      expect(clamp(-Number.MAX_VALUE, options)).toBe(-Number.MAX_VALUE)
      expect(clamp(-5, options)).toBe(-5)
      expect(clamp(0, options)).toBe(0)
    })

    it('uses both default bounds when options is undefined', () => {
      const options = undefined as unknown as ClampOptions
      expect(clamp(5, options)).toBe(5)
      expect(clamp(-5, options)).toBe(-5)
      expect(clamp(Number.POSITIVE_INFINITY, options)).toBe(Number.MAX_VALUE)
      expect(clamp(Number.NEGATIVE_INFINITY, options)).toBe(-Number.MAX_VALUE)
    })

    it('returns NaN for an invalid value when strict is not set', () => {
      expect(clamp(Number.NaN, bounds)).toBeNaN()
    })

    it('returns undefined for an invalid value when only strict is set', () => {
      expect(clamp(Number.NaN, { ...bounds, strict: true })).toBeUndefined()
    })
  })

  describe('invalid values', () => {
    describe('with strict set to false', () => {
      it('returns NaN when the input is NaN or undefined', () => {
        expect(clamp(Number.NaN, { ...bounds, strict: false })).toBeNaN()
        expect(clamp(undefined as unknown as number, bounds)).toBeNaN()
      })

      it('returns NaN when min or max is NaN', () => {
        expect(clamp(5, { min: Number.NaN, max: 10 })).toBeNaN()
        expect(clamp(5, { min: 1, max: Number.NaN })).toBeNaN()
      })

      it('ignores strictBehaviour', () => {
        for (const strictBehaviour of Object.values(ClampUndefinedBehaviour)) {
          expect(clamp(Number.NaN, { ...bounds, strict: false, strictBehaviour })).toBeNaN()
        }
      })
    })

    describe('with strict set to true', () => {
      const strict = { ...bounds, strict: true } as const

      it('returns undefined with RETURN_UNDEFINED', () => {
        const options = { ...strict, strictBehaviour: ClampUndefinedBehaviour.RETURN_UNDEFINED }
        expect(clamp(Number.NaN, options)).toBeUndefined()
        expect(clamp(undefined as unknown as number, options)).toBeUndefined()
        expect(clamp(5, { ...options, min: Number.NaN })).toBeUndefined()
        expect(clamp(5, { ...options, max: Number.NaN })).toBeUndefined()
      })

      it('returns min with CLAMP_TO_LOWEST', () => {
        const options = { ...strict, strictBehaviour: ClampUndefinedBehaviour.CLAMP_TO_LOWEST }
        expect(clamp(Number.NaN, options)).toBe(1)
        expect(clamp(undefined as unknown as number, options)).toBe(1)
        expect(clamp(5, { ...options, max: Number.NaN })).toBe(1)
      })

      it('returns max with CLAMP_TO_HIGHEST', () => {
        const options = { ...strict, strictBehaviour: ClampUndefinedBehaviour.CLAMP_TO_HIGHEST }
        expect(clamp(Number.NaN, options)).toBe(10)
        expect(clamp(undefined as unknown as number, options)).toBe(10)
        expect(clamp(5, { ...options, min: Number.NaN })).toBe(10)
      })

      it('returns undefined instead of a NaN bound', () => {
        expect(
          clamp(5, {
            ...strict,
            min: Number.NaN,
            strictBehaviour: ClampUndefinedBehaviour.CLAMP_TO_LOWEST,
          }),
        ).toBeUndefined()
        expect(
          clamp(5, {
            ...strict,
            max: Number.NaN,
            strictBehaviour: ClampUndefinedBehaviour.CLAMP_TO_HIGHEST,
          }),
        ).toBeUndefined()
      })

      it('uses the default bound when a bound is undefined', () => {
        const options = {
          ...strict,
          min: undefined,
          strictBehaviour: ClampUndefinedBehaviour.CLAMP_TO_LOWEST,
        } as unknown as ClampOptions
        expect(clamp(Number.NaN, options)).toBe(-Number.MAX_VALUE)
      })

      it('returns undefined for an unknown strictBehaviour', () => {
        const options = {
          ...strict,
          strictBehaviour: 'not-a-behaviour' as unknown as ClampUndefinedBehaviour,
        }
        expect(clamp(Number.NaN, options)).toBeUndefined()
      })

      it('still clamps valid values', () => {
        for (const strictBehaviour of Object.values(ClampUndefinedBehaviour)) {
          const options = { ...strict, strictBehaviour }
          expect(clamp(5, options)).toBe(5)
          expect(clamp(-3, options)).toBe(1)
          expect(clamp(15, options)).toBe(10)
        }
      })
    })
  })

  it('does not mutate the options object', () => {
    const options = Object.freeze({ min: 1, max: 10, strict: false })
    expect(clamp(15, options)).toBe(10)
    expect(options).toEqual({ min: 1, max: 10, strict: false })
  })

  it('matches each TSDoc example', () => {
    expect(clamp(5, { min: 1, max: 10 })).toBe(5)
    expect(clamp(-3, { min: 1, max: 10 })).toBe(1)
    expect(clamp(15, { min: 1, max: 10 })).toBe(10)
    expect(clamp(Number.NaN, { min: 1, max: 10 })).toBeNaN()
    expect(clamp(Number.NaN, { min: 1, max: 10, strict: true })).toBeUndefined()
    expect(
      clamp(Number.NaN, { min: 1, max: 10, strict: true, strictBehaviour: 'clamp-to-lowest' }),
    ).toBe(1)
    expect(() => clamp(5, { min: 10, max: 1 })).toThrow(RangeError)
  })
})
