// Public types for from-query-string.
// Every exported name must start with "FromQueryString".

import type {
  QueryStringDeepOptions,
  QueryStringShallowOptions,
} from '../../_internal/object/query-string/query-string.types'

/**
 * Options for `fromQueryString` when keys are kept flat, with no nesting.
 *
 * @category object
 */
export interface FromQueryStringOptionsShallow extends QueryStringShallowOptions {
  /** Keys are not split on `deepSeparator` — each param becomes one top-level key as-is. */
  deep: false
}

/**
 * Options for `fromQueryString` when keys are split into nested objects. This is the default.
 *
 * @category object
 */
export interface FromQueryStringOptionsDeep extends QueryStringDeepOptions {
  /** Keys containing `deepSeparator` are split and rebuilt into nested objects. @default true */
  deep?: true
}

/**
 * Options for `fromQueryString`. Set `deep: false` to keep keys flat.
 *
 * @category object
 */
export type FromQueryStringOptions = FromQueryStringOptionsShallow | FromQueryStringOptionsDeep
