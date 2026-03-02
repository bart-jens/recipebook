/**
 * Call a Supabase RPC function that is not yet present in the generated types.
 * Use this as a temporary bridge until `npm run gen:types` is re-run after
 * applying the migration that introduces the function.
 *
 * Casting through `unknown` avoids `@typescript-eslint/no-explicit-any` while
 * still letting us call arbitrary RPC names at runtime.
 */
type RpcFn<T> = (
  fn: string,
  args?: Record<string, unknown>
) => Promise<{ data: T | null; error: unknown }>;

export function untypedRpc<T>(
  supabase: { rpc: unknown },
  fn: string,
  args?: Record<string, unknown>
): Promise<{ data: T | null; error: unknown }> {
  return (supabase.rpc as unknown as RpcFn<T>)(fn, args);
}
