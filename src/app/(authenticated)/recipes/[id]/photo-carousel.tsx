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
      <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg">
        <img
          src={photos[0].url}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
        <img
          src={photos[activeIndex].url}
          alt=""
          className="h-full w-full object-cover"
        />

        {/* Navigation arrows */}
        <button
          onClick={() => setActiveIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
          aria-label="Previous photo"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => setActiveIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
          aria-label="Next photo"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Counter */}
        <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
          {activeIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="mt-2 flex gap-2 overflow-x-auto">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setActiveIndex(i)}
            className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
              i === activeIndex ? "border-accent" : "border-transparent"
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
