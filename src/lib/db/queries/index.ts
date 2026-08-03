/**
 * Legacy directory alias — DO NOT USE.
 *
 * The canonical cached-query barrel lives at `src/lib/db/queries.ts`
 * (module `@/lib/db/queries`). TypeScript/bundlers resolve the file
 * `queries.ts` before the directory `queries/index.ts`, so this file
 * is never loaded. It exists only so the `queries/` directory is not
 * accidentally treated as a separate module; it re-exports the same
 * surface for consistency.
 */
export * from "../queries";
