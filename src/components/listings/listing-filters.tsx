"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TRUCK_MAKES, US_STATES } from "@/lib/constants";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";

const SORT_OPTIONS = [
  { value: "ending", label: "Ending Soonest" },
  { value: "newest", label: "Newly Listed" },
  { value: "bids", label: "Most Bids" },
  { value: "mileage", label: "Lowest Mileage" },
];

const TRANSMISSION_OPTIONS = [
  { value: "MANUAL", label: "Manual" },
  { value: "AUTO", label: "Automatic" },
  { value: "AUTOMATED_MANUAL", label: "Automated Manual" },
];

const SLEEPER_OPTIONS = [
  { value: "NONE", label: "None (Day Cab)" },
  { value: "MID_ROOF", label: "Mid Roof" },
  { value: "RAISED_ROOF", label: "Raised Roof" },
  { value: "FLAT_TOP", label: "Flat Top" },
  { value: "CONDO", label: "Condo" },
];

const EMISSIONS_OPTIONS = [
  { value: "PRE_EPA07", label: "Pre-EPA 2007" },
  { value: "EPA07", label: "EPA 2007" },
  { value: "EPA10", label: "EPA 2010" },
  { value: "EPA13", label: "EPA 2013" },
  { value: "EPA17_PLUS", label: "EPA 2017+" },
];

const STATE_OPTIONS = US_STATES.map((s) => ({ value: s, label: s }));

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 py-3.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500"
      >
        {title}
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        )}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

interface ListingFiltersProps {
  totalCount: number;
}

export function ListingFilters({ totalCount }: ListingFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Read current filter values from URL
  const currentMakes = searchParams.get("make")?.split(",").filter(Boolean) ?? [];
  const currentYearMin = searchParams.get("yearMin") ?? "";
  const currentYearMax = searchParams.get("yearMax") ?? "";
  const currentMileageMin = searchParams.get("mileageMin") ?? "";
  const currentMileageMax = searchParams.get("mileageMax") ?? "";
  const currentPriceMin = searchParams.get("priceMin") ?? "";
  const currentPriceMax = searchParams.get("priceMax") ?? "";
  const currentTransmission = searchParams.get("transmissionType") ?? "";
  const currentSleeper = searchParams.get("sleeperType") ?? "";
  const currentEmissions = searchParams.get("emissionsStandard") ?? "";
  const currentCarbCompliant = searchParams.get("carbCompliant") === "true";
  const currentState = searchParams.get("state") ?? "";
  const currentSort = searchParams.get("sort") ?? "ending";

  // Count active filters (excluding sort)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (currentMakes.length > 0) count++;
    if (currentYearMin || currentYearMax) count++;
    if (currentMileageMin || currentMileageMax) count++;
    if (currentPriceMin || currentPriceMax) count++;
    if (currentTransmission) count++;
    if (currentSleeper) count++;
    if (currentEmissions) count++;
    if (currentCarbCompliant) count++;
    if (currentState) count++;
    return count;
  }, [
    currentMakes.length,
    currentYearMin,
    currentYearMax,
    currentMileageMin,
    currentMileageMax,
    currentPriceMin,
    currentPriceMax,
    currentTransmission,
    currentSleeper,
    currentEmissions,
    currentCarbCompliant,
    currentState,
  ]);

  // Update URL search params
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router],
  );

  // Toggle a make checkbox
  const toggleMake = useCallback(
    (make: string) => {
      const makes = new Set(currentMakes);
      if (makes.has(make)) {
        makes.delete(make);
      } else {
        makes.add(make);
      }
      const value = Array.from(makes).join(",");
      updateParams({ make: value || null });
    },
    [currentMakes, updateParams],
  );

  // Clear all filters
  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [pathname, router]);

  // Close mobile panel on escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    if (mobileOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const filtersContent = (
    <div className="space-y-0">
      {/* Sort */}
      <div className="pb-3.5">
        <Select
          label="Sort by"
          options={SORT_OPTIONS}
          value={currentSort}
          onChange={(e) => updateParams({ sort: e.target.value || null })}
        />
      </div>

      {/* Make */}
      <FilterSection title="Make">
        <div className="space-y-2">
          {TRUCK_MAKES.map((make) => (
            <label key={make} className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              <input
                type="checkbox"
                checked={currentMakes.includes(make)}
                onChange={() => toggleMake(make)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              {make}
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Year Range */}
      <FilterSection title="Year" defaultOpen={!!(currentYearMin || currentYearMax)}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={currentYearMin}
            onChange={(e) => updateParams({ yearMin: e.target.value || null })}
            className="h-8 text-sm"
          />
          <span className="text-xs text-gray-300">&ndash;</span>
          <Input
            type="number"
            placeholder="Max"
            value={currentYearMax}
            onChange={(e) => updateParams({ yearMax: e.target.value || null })}
            className="h-8 text-sm"
          />
        </div>
      </FilterSection>

      {/* Mileage Range */}
      <FilterSection title="Mileage" defaultOpen={!!(currentMileageMin || currentMileageMax)}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={currentMileageMin}
            onChange={(e) => updateParams({ mileageMin: e.target.value || null })}
            className="h-8 text-sm"
          />
          <span className="text-xs text-gray-300">&ndash;</span>
          <Input
            type="number"
            placeholder="Max"
            value={currentMileageMax}
            onChange={(e) => updateParams({ mileageMax: e.target.value || null })}
            className="h-8 text-sm"
          />
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price" defaultOpen={!!(currentPriceMin || currentPriceMax)}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min ($)"
            value={currentPriceMin}
            onChange={(e) => updateParams({ priceMin: e.target.value || null })}
            className="h-8 text-sm"
          />
          <span className="text-xs text-gray-300">&ndash;</span>
          <Input
            type="number"
            placeholder="Max ($)"
            value={currentPriceMax}
            onChange={(e) => updateParams({ priceMax: e.target.value || null })}
            className="h-8 text-sm"
          />
        </div>
      </FilterSection>

      {/* Transmission */}
      <FilterSection title="Transmission" defaultOpen={!!currentTransmission}>
        <Select
          options={TRANSMISSION_OPTIONS}
          placeholder="Any"
          value={currentTransmission}
          onChange={(e) => updateParams({ transmissionType: e.target.value || null })}
        />
      </FilterSection>

      {/* Sleeper Type */}
      <FilterSection title="Sleeper Type" defaultOpen={!!currentSleeper}>
        <Select
          options={SLEEPER_OPTIONS}
          placeholder="Any"
          value={currentSleeper}
          onChange={(e) => updateParams({ sleeperType: e.target.value || null })}
        />
      </FilterSection>

      {/* Emissions Standard */}
      <FilterSection title="Emissions Standard" defaultOpen={!!currentEmissions}>
        <Select
          options={EMISSIONS_OPTIONS}
          placeholder="Any"
          value={currentEmissions}
          onChange={(e) => updateParams({ emissionsStandard: e.target.value || null })}
        />
      </FilterSection>

      {/* CARB Compliant */}
      <FilterSection title="Compliance" defaultOpen={currentCarbCompliant}>
        <label className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
          <input
            type="checkbox"
            checked={currentCarbCompliant}
            onChange={(e) =>
              updateParams({ carbCompliant: e.target.checked ? "true" : null })
            }
            className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          CARB Compliant
        </label>
      </FilterSection>

      {/* State */}
      <FilterSection title="Location" defaultOpen={!!currentState}>
        <Select
          options={STATE_OPTIONS}
          placeholder="Any State"
          value={currentState}
          onChange={(e) => updateParams({ state: e.target.value || null })}
        />
      </FilterSection>

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <div className="pt-4">
          <button
            onClick={clearAll}
            className="flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium text-gray-500 transition-colors hover:text-brand-600"
          >
            <X className="h-3.5 w-3.5" />
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen(true)}
          className="relative"
        >
          <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile slide-over panel */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/25 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              {filtersContent}
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <Button
                className="w-full"
                onClick={() => setMobileOpen(false)}
              >
                Show {totalCount} {totalCount === 1 ? "Result" : "Results"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 lg:block">
        <div className="sticky top-4 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-900">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </h2>
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </div>
          {filtersContent}
        </div>
      </aside>

      {/* Loading overlay */}
      {isPending && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-start justify-center pt-32">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <p className="text-sm text-gray-500">Updating results...</p>
          </div>
        </div>
      )}
    </>
  );
}
