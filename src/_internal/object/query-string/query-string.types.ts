// Option types shared by toQueryString and fromQueryString. Each public options interface extends
// one of these, so the two functions cannot drift apart on the options that must match for a
// round trip. The value unions are written inline so TypeDoc shows them on the public pages.

interface QueryStringOptionsBase {
  /**
   * How values are written and read.
   *
   * - `'string'`: each value is a string, or an array of strings. The keys give all of the
   *   structure. `fromQueryString` does not guess a type, so `42` comes back as `'42'`.
   * - `'json'`: each value is written as JSON, strings included (`name=%22Ada%22`), so numbers,
   *   booleans, `null`, empty objects and empty arrays come back with their type.
   *
   * Use the same mode in `toQueryString` and `fromQueryString`.
   *
   * @default 'string'
   */
  mode?: 'string' | 'json'

  /**
   * How arrays are written and read.
   *
   * - `'repeat'`: one key for each item (`tags=a&tags=b`). Two or more equal keys decode as an
   *   array. One key decodes as one value, so a one-item array comes back as its item, and an
   *   empty array is omitted.
   * - `'json'`: the array is written as one JSON value (`tags=%5B%22a%22%5D`). In strings-only
   *   mode, `fromQueryString` returns this as a JSON string.
   *
   * @default 'repeat' in strings-only mode, 'json' in JSON mode
   */
  arrayFormat?: 'repeat' | 'json'
}

/** Nesting options when keys are kept flat. */
export interface QueryStringShallowOptions extends QueryStringOptionsBase {
  /** Nested objects are not flattened into separate keys. */
  deep: false
}

/** Nesting options when nested objects are flattened into separate keys. This is the default. */
export interface QueryStringDeepOptions extends QueryStringOptionsBase {
  /** Nested objects are flattened into `parent.child=value` keys. @default true */
  deep?: true
  /**
   * The text between the segments of a flattened key. It must not be empty.
   * @default '.'
   */
  deepSeparator?: string
  /**
   * The number of nesting levels to flatten. Deeper objects are written as JSON.
   * @default Infinity
   */
  deepLimit?: number
}

/** The options that both functions resolve in the same way. */
export interface QueryStringResolvedOptions {
  mode: 'string' | 'json'
  arrayFormat: 'repeat' | 'json'
  deep: boolean
  deepSeparator: string
  deepLimit: number
}
