import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChefHatIcon, UtensilsCrossedIcon, ClockIcon } from "lucide-react";

export function RecipeCard({ recipe, onView }) {
  const totalIngredients =
    recipe.usedIngredients.length + recipe.missingIngredients.length;

  const hasScore = recipe.scores?.final_score != null;
  const matchPercent = hasScore
    ? Math.round(recipe.scores.final_score * 100)
    : totalIngredients > 0
      ? Math.round((recipe.usedIngredients.length / totalIngredients) * 100)
      : 0;

  const subtitle = hasScore && recipe.scores.explanation
    ? recipe.scores.explanation
    : recipe.summary;

  return (
    <Card
      className="group overflow-hidden border-orange-100/60 bg-white shadow-sm hover:shadow-lg hover:border-orange-200/80 transition-all duration-300 cursor-pointer"
      onClick={() => onView(recipe)}
    >
      <div className="relative">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="h-44 w-full bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
            <ChefHatIcon className="h-10 w-10 text-orange-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {(totalIngredients > 0 || hasScore) && (
          <div className="absolute top-2.5 right-2.5">
            <div
              className={`text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm ${
                matchPercent >= 70
                  ? "bg-emerald-500/90 text-white"
                  : matchPercent >= 40
                    ? "bg-amber-500/90 text-white"
                    : "bg-white/80 text-gray-700"
              }`}
            >
              {hasScore ? `${matchPercent}% match` : `${recipe.usedIngredients.length}/${totalIngredients} match`}
            </div>
          </div>
        )}

        {recipe.readyInMinutes > 0 && (
          <div className="absolute top-2.5 left-2.5">
            <div className="text-[10px] font-medium px-1.5 py-0.5 rounded-full backdrop-blur-sm bg-white/80 text-gray-700 flex items-center gap-0.5">
              <ClockIcon className="w-3 h-3" />
              {recipe.readyInMinutes}m
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-white text-sm leading-snug drop-shadow-md line-clamp-2">
            {recipe.title}
          </h3>
        </div>
      </div>

      <CardContent className="p-3 space-y-2.5">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {subtitle}
        </p>

        {recipe.diets?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.diets.slice(0, 3).map((diet) => (
              <Badge
                key={`diet-${recipe.id}-${diet}`}
                className="bg-violet-50 text-violet-700 border-violet-200/60 text-[10px] font-medium px-1.5 py-0"
              >
                {diet}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {recipe.usedIngredients.slice(0, 3).map((ingredient) => (
            <Badge
              key={`used-${recipe.id}-${ingredient}`}
              className="bg-emerald-50 text-emerald-700 border-emerald-200/60 text-[10px] font-medium px-1.5 py-0"
            >
              {ingredient}
            </Badge>
          ))}
          {recipe.missingIngredients.slice(0, 2).map((ingredient) => (
            <Badge
              key={`missing-${recipe.id}-${ingredient}`}
              variant="outline"
              className="text-[10px] text-muted-foreground border-dashed px-1.5 py-0"
            >
              {ingredient}
            </Badge>
          ))}
          {recipe.usedIngredients.length +
            recipe.missingIngredients.length >
            5 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +
              {recipe.usedIngredients.length +
                recipe.missingIngredients.length -
                5}{" "}
              more
            </span>
          )}
        </div>

        <Button
          className="w-full h-8 text-xs font-medium"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onView(recipe);
          }}
        >
          <UtensilsCrossedIcon className="w-3.5 h-3.5 mr-1" />
          View Recipe
        </Button>
      </CardContent>
    </Card>
  );
}
