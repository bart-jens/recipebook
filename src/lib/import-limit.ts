import { SupabaseClient } from "@supabase/supabase-js";

export interface ImportLimitResult {
  allowed: boolean;
  used: number;
  limit: number;
}

export class ImportLimitError extends Error {
  used: number;
  limit: number;
  constructor(used: number, limit: number) {
    super("import_limit_reached");
    this.used = used;
    this.limit = limit;
  }
}

/**
 * Atomically checks and increments the user's monthly import counter.
 * Throws ImportLimitError if the free-tier limit is reached.
 * Premium users are always allowed.
 */
export async function checkImportLimit(
  supabase: SupabaseClient
): Promise<ImportLimitResult> {
  const { data, error } = await supabase.rpc(
    "check_and_increment_import_count"
  );

  if (error) {
    throw new Error(`Import limit check failed: ${error.message}`);
  }

  const result = data as ImportLimitResult;

  if (!result.allowed) {
    throw new ImportLimitError(result.used, result.limit);
  }

  return result;
}
