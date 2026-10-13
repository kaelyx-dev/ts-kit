// Public types for with-defaults.
// Every exported name must start with "WithDefaults".

/**
 * Represents an object type `T` with default values `D` applied.
 * Keys present in `D` are made required and their `undefined` type is excluded from `T`.
 */
export type WithDefaults<T, D> = Omit<T, keyof D> & {
  [K in keyof D & keyof T]-?: Exclude<T[K], undefined>;
};