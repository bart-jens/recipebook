import { RecipeForm } from "../components/recipe-form";
import { createRecipe } from "../actions";
import Link from "next/link";

export default function NewRecipePage() {
  return (
    <div>
      <div className="mb-8">
        <Link href="/recipes" className="text-sm text-warm-gray hover:text-accent">
          &larr; Back to recipes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New Recipe</h1>
      </div>
      <RecipeForm action={createRecipe} submitLabel="Create Recipe" />
    </div>
  );
}
