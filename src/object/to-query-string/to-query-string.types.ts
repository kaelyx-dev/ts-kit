interface ToQueryStringOptionsBase {
  /**
   * Caps how many levels deep JSON.stringify will go when a value is
   * serialised, truncating further nesting with a placeholder.
   * @default 2
   */
  serialiseLimit?: number
}

export interface ToQueryStringOptionsShallow extends ToQueryStringOptionsBase {
  /** Nested objects are serialised as a single JSON-string param instead of flattened. */
  deep: false
  /**
   * Whether nested objects are serialised to JSON at all.
   * If `false`, keys whose value is a nested object are dropped.
   * @default true
   */
  serialiseOnShallow?: boolean
}

export interface ToQueryStringOptionsDeep extends ToQueryStringOptionsBase {
  /** Nested objects are flattened into `parent.child=value` keys. @default true */
  deep?: true
  /** @default '.' */
  deepSeparator?: string
  /** @default Infinity */
  deepLimit?: number
  /**
   * What happens to a nested object once `deepLimit` is reached.
   * @default true
   */
  serialiseOnDeepLimitExceeded?: boolean
}

export type ToQueryStringOptions = ToQueryStringOptionsShallow | ToQueryStringOptionsDeep

/**
 * Internal, fully-resolved form of {@link ToQueryStringOptions}. Not part
 * of the public API — built once by `resolveOptions` and passed through
 * the serialising helpers. Derived from both branches (minus `deep`, which
 * differs in type between them) so it can't drift if a branch gains a new
 * option.
 *
 * @internal
 */
export type ToQueryStringResolvedOptions = { deep: boolean } & Required<
  Omit<ToQueryStringOptionsShallow, 'deep'>
> &
  Required<Omit<ToQueryStringOptionsDeep, 'deep'>>
