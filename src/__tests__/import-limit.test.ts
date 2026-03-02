import { checkImportLimit, ImportLimitError } from "../lib/import-limit";
import type { SupabaseClient } from "@supabase/supabase-js";

function makeClient(result: { data: unknown; error: unknown }) {
  return {
    rpc: jest.fn().mockResolvedValue(result),
  } as unknown as SupabaseClient;
}

describe("checkImportLimit", () => {
  it("returns result when import is allowed (within limit)", async () => {
    const client = makeClient({ data: { allowed: true, used: 5, limit: 10 }, error: null });
    const result = await checkImportLimit(client);
    expect(result).toEqual({ allowed: true, used: 5, limit: 10 });
    expect(client.rpc).toHaveBeenCalledWith("check_and_increment_import_count");
  });

  it("throws ImportLimitError when limit is reached", async () => {
    const client = makeClient({ data: { allowed: false, used: 10, limit: 10 }, error: null });
    await expect(checkImportLimit(client)).rejects.toThrow(ImportLimitError);
    await expect(checkImportLimit(client)).rejects.toMatchObject({ used: 10, limit: 10 });
  });

  it("allows premium users (limit: 0 means unlimited)", async () => {
    const client = makeClient({ data: { allowed: true, used: 0, limit: 0 }, error: null });
    const result = await checkImportLimit(client);
    expect(result.allowed).toBe(true);
  });

  it("allows free user on first import of a new month (lazy reset scenario)", async () => {
    // After a monthly reset, used resets to 1 on the first import
    const client = makeClient({ data: { allowed: true, used: 1, limit: 10 }, error: null });
    const result = await checkImportLimit(client);
    expect(result.used).toBe(1);
    expect(result.allowed).toBe(true);
  });

  it("throws generic Error when RPC fails", async () => {
    const client = makeClient({ data: null, error: { message: "DB error" } });
    await expect(checkImportLimit(client)).rejects.toThrow("Import limit check failed: DB error");
  });

  it("ImportLimitError has correct message and properties", () => {
    const err = new ImportLimitError(10, 10);
    expect(err.message).toBe("import_limit_reached");
    expect(err.used).toBe(10);
    expect(err.limit).toBe(10);
    expect(err).toBeInstanceOf(Error);
  });
});
