"use client";

import { useState } from "react";
import { RecipeForm, type RecipeFormData } from "../../components/recipe-form";

interface EditRecipeClientProps {
  initialData: RecipeFormData;
  initialSourceName: string | null;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}

export function EditRecipeClient({ initialData, initialSourceName, action }: EditRecipeClientProps) {
  const [sourceName, setSourceName] = useState(initialSourceName || "");

  return (
    <RecipeForm
      initialData={initialData}
      action={action}
      submitLabel="Save Changes"
      sourceName={sourceName}
      onSourceNameChange={setSourceName}
    />
  );
}
