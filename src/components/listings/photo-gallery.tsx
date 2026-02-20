"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Enum display map ─────────────────────────────────────────────────────────

const PHOTO_CATEGORY_LABELS: Record<string, string> = {
  EXTERIOR_FRONT: "Exterior Front",
  EXTERIOR_REAR: "Exterior Rear",
  EXTERIOR_DRIVER_SIDE: "Driver Side",
  EXTERIOR_PASSENGER_SIDE: "Passenger Side",
  ENGINE_BAY: "Engine Bay",
  FRAME_RAILS: "Frame Rails",
  FIFTH_WHEEL: "Fifth Wheel",
  UNDERCARRIAGE: "Undercarriage",
  CAB_INTERIOR: "Cab Interior",
  DASHBOARD: "Dashboard",
  SLEEPER: "Sleeper",
  GAUGES_ODOMETER: "Gauges / Odometer",
  TIRES_FRONT: "Tires Front",
  TIRES_REAR: "Tires Rear",
  DOT_STICKER: "DOT Sticker",
  DAMAGE_DOCUMENTATION: "Damage Docs",
  MAINTENANCE_DOCS: "Maintenance Docs",
  OTHER: "Other",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  category: string;
  caption: string | null;
  sortOrder: number;
}

interface PhotoGalleryProps {
  photos: Photo[];
  title: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const sorted = [...photos].sort((a, b) => a.sortOrder - b.sortOrder);
  const current = sorted[selectedIndex];

  const goTo = useCallback(
    (index: number) => {
      setSelectedIndex(
        ((index % sorted.length) + sorted.length) % sorted.length
      );
    },
    [sorted.length]
  );

  const goPrev = useCallback(() => goTo(selectedIndex - 1), [goTo, selectedIndex]);
  const goNext = useCallback(() => goTo(selectedIndex + 1), [goTo, selectedIndex]);

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-gray-100">
        <p className="text-sm text-gray-400">No photos available</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Main gallery ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {/* Hero image */}
        <div className="group relative aspect-[16/9] cursor-pointer overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={current.url}
            alt={current.caption || `${title} — ${PHOTO_CATEGORY_LABELS[current.category] ?? current.category}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 900px"
            priority
            onClick={() => setLightboxOpen(true)}
          />

          {/* Category label */}
          <Badge
            variant="navy"
            className="absolute bottom-3 left-3 shadow-sm"
          >
            {PHOTO_CATEGORY_LABELS[current.category] ?? current.category}
          </Badge>

          {/* Photo counter */}
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
            {selectedIndex + 1} / {sorted.length}
          </div>

          {/* Prev / Next on hero */}
          {sorted.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {sorted.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sorted.map((photo, idx) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                  idx === selectedIndex
                    ? "border-brand-600 ring-1 ring-brand-600"
                    : "border-transparent hover:border-gray-300"
                }`}
                aria-label={`View ${PHOTO_CATEGORY_LABELS[photo.category] ?? photo.category}`}
              >
                <Image
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.caption || (PHOTO_CATEGORY_LABELS[photo.category] ?? "")}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox modal ─────────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div className="absolute left-4 top-4 z-10 rounded-full bg-black/50 px-4 py-1.5 text-sm font-medium text-white">
            {selectedIndex + 1} / {sorted.length}
          </div>

          {/* Image */}
          <div
            className="relative mx-16 h-[80vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current.url}
              alt={current.caption || title}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />

            {/* Caption / category */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/60 px-4 py-2 text-center text-sm text-white">
              <span className="font-medium">
                {PHOTO_CATEGORY_LABELS[current.category] ?? current.category}
              </span>
              {current.caption && (
                <span className="ml-2 text-gray-300">
                  &mdash; {current.caption}
                </span>
              )}
            </div>
          </div>

          {/* Prev / Next */}
          {sorted.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
                aria-label="Next photo"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
