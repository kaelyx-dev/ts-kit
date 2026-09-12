// Public types for is-json.
// Every exported name must start with "IsJson".
export type JsonParseResult<T = unknown> =
  | { valid: true; data: T }
  | { valid: false; error: unknown }
