export * from './from-query-string.types'
import type { FromQueryStringResult } from './from-query-string.types'

/**
 * fromQueryString, converts a query string to a flat object with `URLSearchParams`.
 *
 * A key that occurs once gives a string. A key that occurs two or more times gives an array of
 * strings, in order. Values are not converted, so `"page=2"` gives `{ page: '2' }`. Keys are not
 * split, so `"a.b=1"` gives `{ 'a.b': '1' }`.
 *
 * Keys such as `__proto__` become normal own properties. They do not change the prototype of the
 * result.
 *
 * @param input - The query string to parse. A leading `?` is removed. An empty string returns `{}`.
 * @returns A plain object with one property for each key.
 *
 * @example
 * ```ts
 * fromQueryString('q=red+shoes&page=2') // { q: 'red shoes', page: '2' }
 * fromQueryString('?tags=new&tags=sale') // { tags: ['new', 'sale'] }
 * fromQueryString('a=') // { a: '' }
 * fromQueryString('name=Ada%20Lovelace') // { name: 'Ada Lovelace' }
 * fromQueryString('a.b=1') // { 'a.b': '1' }
 * fromQueryString('') // {}
 * ```
 *
 * @category object
 */
export function fromQueryString(input: string): FromQueryStringResult {
  const params = new URLSearchParams(input)
  // Object.fromEntries defines own properties, so a "__proto__" key cannot set the prototype.
  return Object.fromEntries(
    [...new Set(params.keys())].map((key) => {
      const values = params.getAll(key)
      return [key, values.length === 1 ? (values[0] as string) : values]
    }),
  )
}
