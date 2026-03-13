import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "saved_recipes_v1";

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useSavedRecipes() {
  const [savedRecipes, setSavedRecipes] = useState(loadSaved);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  const isRecipeSaved = useCallback(
    (recipeId) => savedRecipes.some((r) => String(r.id) === String(recipeId)),
    [savedRecipes]
  );

  const saveRecipe = useCallback(
    (recipe) => {
      setSavedRecipes((prev) => {
        if (prev.some((r) => String(r.id) === String(recipe.id))) return prev;
        toast.success("Recipe saved", { description: recipe.title });
        return [...prev, recipe];
      });
    },
    []
  );

  const removeRecipe = useCallback(
    (recipeId) => {
      setSavedRecipes((prev) => {
        const next = prev.filter((r) => String(r.id) !== String(recipeId));
        if (next.length < prev.length) {
          toast("Recipe removed from saved");
        }
        return next;
      });
    },
    []
  );

  const toggleSave = useCallback(
    (recipe) => {
      if (isRecipeSaved(recipe.id)) {
        removeRecipe(recipe.id);
      } else {
        saveRecipe(recipe);
      }
    },
    [isRecipeSaved, removeRecipe, saveRecipe]
  );

  return {
    savedRecipes,
    saveRecipe,
    removeRecipe,
    isRecipeSaved,
    toggleSave,
    count: savedRecipes.length,
  };
}
