import Link from "next/link";

export default function ImportPage() {
  return (
    <div className="px-5 py-4 pb-24">
      <div className="mb-8">
        <Link href="/recipes" className="text-sm text-warm-gray hover:text-accent">
          &larr; Back to recipes
        </Link>
        <h1 className="mt-2 text-[28px] font-light tracking-[-0.02em] text-ink">Import Recipe</h1>
        <p className="mt-1 text-[13px] font-light text-ink-secondary leading-[1.45]">
          Recipes you import are saved to your personal cookbook — only you can see them. Your cooking activity still appears in your feed.
        </p>
      </div>

      <div className="grid gap-4 max-w-lg">
        <Link
          href="/recipes/import-url"
          className="group block bg-warm-tag p-5 border border-warm-border transition-all hover:-translate-y-px hover:shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent/10 text-accent">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-normal group-hover:text-accent">From Link</h2>
              <p className="mt-0.5 text-sm text-warm-gray">
                Paste a URL from any recipe website or Instagram post
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/recipes/import-photo"
          className="group block bg-warm-tag p-5 border border-warm-border transition-all hover:-translate-y-px hover:shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent/10 text-accent">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-normal group-hover:text-accent">From Photo</h2>
              <p className="mt-0.5 text-sm text-warm-gray">
                Upload a photo of a recipe from a cookbook or printout
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
