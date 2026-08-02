"use client";
export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center bg-foreground text-background">
            <span className="text-xs font-black leading-none">i</span>
          </span>
          <div>
            <p className="text-sm font-bold tracking-tight">ichidok</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Anime, undiluted.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Powered by gdriveplayer</span>
          <span className="opacity-50">·</span>
          <span>508 titles in catalog</span>
          <span className="opacity-50">·</span>
          <span>No ads, no clutter</span>
        </div>

        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Built with Next.js · Deploy on Vercel as{" "}
          <span className="font-semibold text-foreground">ichidokV2</span>
        </p>
      </div>
    </footer>
  );
}
