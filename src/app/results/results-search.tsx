"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface ResultsSearchProps {
  defaultValue: string;
}

export function ResultsSearch({ defaultValue }: ResultsSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("q", query.trim());
      }
      startTransition(() => {
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [query, pathname, router],
  );

  const handleClear = useCallback(() => {
    setQuery("");
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [pathname, router]);

  return (
    <form onSubmit={handleSearch} className="flex gap-3">
      <div className="relative max-w-lg flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by make, model, or year..."
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-10 py-2 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Searching..." : "Search"}
      </Button>
    </form>
  );
}
