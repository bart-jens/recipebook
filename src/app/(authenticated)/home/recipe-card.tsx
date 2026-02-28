'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RecipePlaceholder } from '@/lib/recipe-placeholder';
import { formatTime } from '@/lib/format';

interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    image_url: string | null;
    cook_time_minutes: number | null;
    prep_time_minutes: number | null;
    recipe_tags: { tag: string }[];
  };
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group shrink-0 w-[140px] cursor-pointer"
    >
      {recipe.image_url ? (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          onLoad={() => setLoaded(true)}
          className={`w-[140px] h-[140px] object-cover transition-transform duration-300 group-hover:scale-[1.04] img-reveal${loaded ? ' loaded' : ''}`}
        />
      ) : (
        <RecipePlaceholder id={recipe.id} size={140} />
      )}
      <div className="pt-2">
        {recipe.recipe_tags?.[0] && (
          <div className="text-[11px] font-normal tracking-[0.02em] text-accent mb-0.5">
            {recipe.recipe_tags[0].tag}
          </div>
        )}
        <div className="text-[14px] font-normal leading-[1.2] text-ink line-clamp-2 transition-colors group-hover:text-accent">
          {recipe.title}
        </div>
        {(recipe.cook_time_minutes || recipe.prep_time_minutes) && (
          <div className="text-[11px] font-normal tracking-[0.02em] text-ink-muted mt-0.5">
            {formatTime(recipe.cook_time_minutes || recipe.prep_time_minutes)}
          </div>
        )}
      </div>
    </Link>
  );
}
