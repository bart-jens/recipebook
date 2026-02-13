import { RecipeForm } from "../components/recipe-form";
import { createRecipe } from "../actions";
import Link from "next/link";

export default function NewRecipePage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/recipes" className="text-gray-500 hover:text-gray-700">
          &larr; Back
        </Link>
        <h1 className="text-xl font-semibold">New Recipe</h1>
      </div>
      <RecipeForm action={createRecipe} submitLabel="Create Recipe" />
    </div>
  );
}
