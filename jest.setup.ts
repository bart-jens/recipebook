// Supabase client (web uses createClient() factory, not a singleton)
const makeSupabaseBuilder = () => {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    then: (resolve: (val: any) => any) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  };
  return builder;
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => makeSupabaseBuilder()),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  })),
}));

// next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// next/headers (server-side, needed if any server util is imported transitively)
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(), set: jest.fn(), delete: jest.fn() })),
  headers: jest.fn(() => ({ get: jest.fn() })),
}));

// Suppress console.error for expected test errors
const originalConsoleError = console.error;
beforeEach(() => {
  jest.clearAllMocks();
  console.error = jest.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
});
