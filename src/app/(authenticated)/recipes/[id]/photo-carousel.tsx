"use client";

import { useState } from "react";

interface Photo {
  id: string;
  url: string;
  imageType: string;
}

export function PhotoCarousel({ photos }: { photos: Photo[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (photos.length === 0) return null;

  if (photos.length === 1) {
    return (
      <div className="overflow-hidden h-[220px] relative">
        <img
          src={photos[0].url}
          alt=""
          className="w-full h-full object-cover animate-hero-zoom"
        />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bg to-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden h-[220px]">
        <img
          src={photos[activeIndex].url}
          alt=""
          className="w-full h-full object-cover animate-hero-zoom"
        />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bg to-transparent" />

        {/* Navigation arrows */}
        <button
          onClick={() => setActiveIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-bg/80 backdrop-blur-sm text-ink hover:bg-bg transition-colors"
          aria-label="Previous photo"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => setActiveIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-bg/80 backdrop-blur-sm text-ink hover:bg-bg transition-colors"
          aria-label="Next photo"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Counter */}
        <div className="absolute bottom-6 right-3 font-mono text-[10px] uppercase tracking-[0.06em] bg-bg/80 backdrop-blur-sm px-2 py-0.5 text-ink-muted">
          {activeIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setActiveIndex(i)}
            className={`h-12 w-12 shrink-0 overflow-hidden transition-all ${
              i === activeIndex ? "ring-1 ring-ink" : "opacity-60 hover:opacity-100"
            }`}
          >
            <img
              src={photo.url}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
