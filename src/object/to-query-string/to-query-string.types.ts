import type {
  QueryStringDeepOptions,
  QueryStringShallowOptions,
} from '../../_internal/object/query-string/query-string.types'

interface ToQueryStringOptionsBase {
  /**
   * The number of nesting levels that a value written as JSON can have. If the value goes
   * deeper, `toQueryString` throws a `TypeError`. It never truncates the data.
   * @default Infinity
   */
  serialiseLimit?: number
}

/**
 * Options for `toQueryString` when nested objects are not flattened.
 *
 * @category object
 */
export interface ToQueryStringOptionsShallow
  extends ToQueryStringOptionsBase,
    QueryStringShallowOptions {
  /** Nested objects are serialised as a single JSON-string param instead of flattened. */
  deep: false
  /**
   * Whether nested objects are serialised to JSON at all.
   * If `false`, keys whose value is a nested object are dropped.
   * @default true
   */
  serialiseOnShallow?: boolean
}

/**
 * Options for `toQueryString` when nested objects are flattened into separate keys. This is the default.
 *
 * @category object
 */
export interface ToQueryStringOptionsDeep extends ToQueryStringOptionsBase, QueryStringDeepOptions {
  /**
   * What happens to a nested object once `deepLimit` is reached.
   * @default true
   */
  serialiseOnDeepLimitExceeded?: boolean
}

/**
 * Options for `toQueryString`. Set `deep: false` to keep nested objects as JSON strings.
 *
 * @category object
 */
export type ToQueryStringOptions = ToQueryStringOptionsShallow | ToQueryStringOptionsDeep
