/**
 * Common shared types — small utilities used across features.
 */

/** Nullable<T> — explicitly allows null values (strictNullChecks + readability). */
export type Nullable<T> = T | null;

/** Async state wrapper for loading/error/data patterns. */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
