import React from "react";
import { RecipeCard } from "./RecipeCard";
import { BookmarkIcon } from "lucide-react";

export function SavedRecipesGrid({ savedRecipes, onView, onToggleSave, isRecipeSaved }) {
  if (savedRecipes.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-orange-200 p-12 text-center">
        <BookmarkIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No saved recipes yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Browse the Discover tab and tap the bookmark icon on any recipe card to save it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {savedRecipes.map((recipe) => (
        <RecipeCard
          key={`saved-${recipe.id}`}
          recipe={recipe}
          onView={onView}
          isSaved={true}
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  );
}
