// Public types for is-json.
// Every exported name must start with "IsJson".
export type IsJsonParseResult<T = unknown> =
  | { valid: true; data: T }
  | { valid: false; error: unknown }
