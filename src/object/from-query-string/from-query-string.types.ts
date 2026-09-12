// Public types for from-query-string.
// Every exported name must start with "FromQueryString".

interface FromQueryStringOptionsBase {
  /**
   * When a value looks like JSON (per an `isJson` check — e.g. `{"b":1}` or `[1,2]`),
   * parse it into its real object/array/number/boolean/null form instead of
   * leaving it as a raw string. This is the inverse of `toQueryString`'s
   * `serialiseOnShallow` / `serialiseOnDeepLimitExceeded`.
   *
   * @default true
   */
  parseJson?: boolean

  /**
   * Coerce plain (non-JSON) string values that look like a number or boolean
   * (`"1"`, `"3.5"`, `"true"`, `"false"`) into their real type. Off by default
   * because it's lossy/ambiguous — e.g. a postcode or phone-number-like string
   * of digits would silently become a number.
   *
   * @default false
   */
  parsePrimitives?: boolean
}

export interface FromQueryStringOptionsShallow extends FromQueryStringOptionsBase {
  /** Keys are not split on `deepSeparator` — each param becomes one top-level key as-is. */
  deep: false
}

export interface FromQueryStringOptionsDeep extends FromQueryStringOptionsBase {
  /** Keys containing `deepSeparator` are split and rebuilt into nested objects. @default true */
  deep?: true
  /** @default '.' */
  deepSeparator?: string
  /**
   * Maximum number of `deepSeparator` splits to apply per key before treating
   * the remainder of the key as a literal segment. Mirrors `toQueryString`'s
   * `deepLimit`, and guards against pathologically deep keys.
   *
   * @default Infinity
   */
  deepLimit?: number
}

export type FromQueryStringOptions = FromQueryStringOptionsShallow | FromQueryStringOptionsDeep

/**
 * Internal, fully-resolved form of {@link FromQueryStringOptions}. Not part
 * of the public API — built once by `resolveFromQueryStringOptions` and
 * passed through the parsing helpers. Derived from both branches (minus
 * `deep`, which differs in type between them) so it can't drift if a branch
 * gains a new option.
 */
export type FromQueryStringResolvedOptions = { deep: boolean } & Required<
  Omit<FromQueryStringOptionsShallow, 'deep'>
> &
  Required<Omit<FromQueryStringOptionsDeep, 'deep'>>
