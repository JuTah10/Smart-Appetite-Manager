import { useCallback, useState } from "react";
import { AGENTS } from "@/api/agents";
import {
  getMealById,
  normalizeAgentRecipeDetails,
  toRecipeDetails,
} from "@/lib/mealdb";

/**
 * Hook for loading detailed recipe information (MealDB or agent-sourced).
 *
 * @param {import("@/api/gateway").GatewayClient} client
 * @param {string} sessionKey - localStorage key for session persistence
 */
export function useRecipeDetails(client, sessionKey) {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const open = useCallback(
    async (recipe) => {
      setSelectedRecipe(recipe);
      setDetails(null);
      setError(null);
      setLoading(true);

      try {
        if (recipe.provider === "agent") {
          const response = await client.send(
            `Provide full details for this recipe: "${recipe.title}". Return ONLY JSON with fields: title, ingredients (array of {name, measure}), instructions, image_url, source_url.`,
            AGENTS.RECIPE_RESEARCH
          );
          localStorage.setItem(sessionKey, client.getSessionId());
          setDetails(normalizeAgentRecipeDetails(response.text, recipe));
          return;
        }

        const meal = await getMealById(recipe.id);
        if (!meal) {
          throw new Error("Could not load recipe details.");
        }
        setDetails(toRecipeDetails(meal, recipe));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [client, sessionKey]
  );

  const close = useCallback(() => {
    setSelectedRecipe(null);
    setDetails(null);
    setError(null);
  }, []);

  return {
    selectedRecipe,
    details,
    loading,
    error,
    open,
    close,
  };
}
