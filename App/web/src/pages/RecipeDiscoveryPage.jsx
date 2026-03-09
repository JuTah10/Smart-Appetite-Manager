import React, { useCallback, useMemo, useState } from "react";
import { useGateway } from "@/api";
import { AGENTS } from "@/api/agents";
import { useGatewaySession } from "@/hooks/useGatewaySession";
import { useAssistantChat } from "@/hooks/useAssistantChat";
import { useInventorySuggestions } from "@/hooks/useInventorySuggestions";
import { useRecipeSearch } from "@/hooks/useRecipeSearch";
import { useRecipeDetails } from "@/hooks/useRecipeDetails";
import { getRandomMeal, toRecipeCard } from "@/lib/mealdb";
import { RecipeDetailsDialog } from "@/components/recipes/RecipeDetailsDialog";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { ExecutionTimeline } from "@/components/progress/ExecutionTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ChefHatIcon,
  SearchIcon,
  SparklesIcon,
  RefreshCwIcon,
  MessageCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useEffect } from "react";

const RECIPE_SESSION_KEY = "recipe_gateway_session_id";

const QUICK_TAGS = [
  "Quick dinners",
  "High protein",
  "Comfort food",
  "Vegetarian",
  "One-pot meals",
  "Meal prep",
];

const STORAGE_KEYS = {
  gatewayUrl: "inventory_gateway_url",
  sessionId: RECIPE_SESSION_KEY,
};

export default function RecipeDiscoveryPage() {
  const { client } = useGateway();
  useGatewaySession(client, STORAGE_KEYS, AGENTS.RECIPE_RESEARCH);

  const inventory = useInventorySuggestions(client);
  const recipeSearch = useRecipeSearch(inventory.inventoryNames);
  const recipeDetail = useRecipeDetails(client, RECIPE_SESSION_KEY);

  const [chatOpen, setChatOpen] = useState(false);
  const [featuredRecipe, setFeaturedRecipe] = useState(null);
  const [featuredLoading, setFeaturedLoading] = useState(false);

  const chat = useAssistantChat(client, AGENTS.RECIPE_RESEARCH, {
    welcomeText:
      "Recipe assistant connected. Ask me for recipe recommendations based on your latest inventory.",
    idPrefix: "recipe-chat",
    errorLabel: "Recipe assistant failed",
  });

  const handleQuickSuggestion = useCallback((tag) => {
    setChatOpen(true);
    chat.setInput(tag);
  }, [chat]);

  // Fetch a random featured recipe on mount
  useEffect(() => {
    let cancelled = false;
    setFeaturedLoading(true);
    (async () => {
      try {
        const meal = await getRandomMeal();
        if (cancelled) return;
        const card = toRecipeCard(meal || {}, new Set());
        setFeaturedRecipe(
          card || {
            id: "featured-fallback",
            title: "Featured recipe",
            imageUrl: "",
            summary: "Could not load featured recipe.",
            usedIngredients: [],
            missingIngredients: [],
            sourceUrl: "",
          }
        );
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        toast.error("Could not load featured recipe", { description: message });
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const inventoryMeta = useMemo(() => {
    if (!inventory.itemCount) return "Pantry is empty";
    const suffix = inventory.itemCount === 1 ? "ingredient" : "ingredients";
    return `${inventory.itemCount} pantry ${suffix}`;
  }, [inventory.itemCount]);

  const hasCachedSuggestions = inventory.suggestions.length > 0;
  const freshnessBadge =
    inventory.freshness === "fresh"
      ? "Fresh cache"
      : inventory.freshness === "stale"
        ? "Outdated cache"
        : inventory.freshness === "unknown"
          ? "Unverified cache"
          : "No cache";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[radial-gradient(circle_at_top_left,_rgba(255,244,230,0.95),_#fff_48%),linear-gradient(135deg,_rgba(255,250,241,0.9),_rgba(255,255,255,1))]">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Hero / Search */}
        <Card className="border-orange-100 bg-gradient-to-br from-amber-50 via-orange-50 to-white">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3 max-w-2xl">
                <Badge className="bg-orange-500 text-white hover:bg-orange-500">
                  Recipe Studio
                </Badge>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
                  Cook smarter with pantry-aware recipe discovery
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Browse recipes from MealDB, cache your pantry matches, and
                  refresh only when you choose.
                </p>
              </div>

              <form
                className="w-full md:w-[420px] flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void recipeSearch.search();
                }}
              >
                <div className="relative flex-1">
                  <SearchIcon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-9 pl-8 bg-white"
                    placeholder="Search: salmon, pasta, high-protein dinner..."
                    value={recipeSearch.query}
                    onChange={(e) => recipeSearch.setQuery(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={recipeSearch.searching || !recipeSearch.query.trim()}
                >
                  {recipeSearch.searching ? "Searching..." : "Find"}
                </Button>
              </form>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSuggestion(tag)}
                  className="bg-white"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  {tag}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spotlight + Inventory Best */}
        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr]">
          {/* Recipe Spotlight */}
          <Card className="overflow-hidden border-orange-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Recipe Spotlight</CardTitle>
            </CardHeader>
            <CardContent>
              {featuredLoading && (
                <div className="h-56 rounded-xl bg-muted animate-pulse" />
              )}
              {!featuredLoading && featuredRecipe && (
                <div className="space-y-4">
                  {featuredRecipe.imageUrl ? (
                    <img
                      src={featuredRecipe.imageUrl}
                      alt={featuredRecipe.title}
                      className="h-56 w-full object-cover rounded-xl border"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-56 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <ChefHatIcon className="h-10 w-10 text-orange-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">
                      {featuredRecipe.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {featuredRecipe.summary}
                    </p>
                  </div>
                  <Button
                    onClick={() => void recipeDetail.open(featuredRecipe)}
                  >
                    View spotlight recipe
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Best from Inventory */}
          <Card className="border-orange-100">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">
                    Best from your inventory
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {inventoryMeta}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {inventory.lastUpdated
                      ? `Last generated ${inventory.lastUpdated.toLocaleTimeString()}`
                      : "Not generated yet"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void inventory.generate()}
                  disabled={inventory.loading || inventory.checking}
                  className="shrink-0"
                >
                  <RefreshCwIcon
                    className={`w-3.5 h-3.5 ${inventory.loading ? "animate-spin" : ""}`}
                  />
                  {hasCachedSuggestions ? "Refresh" : "Generate"}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Badge variant="outline">{freshnessBadge}</Badge>
                {inventory.cachedFingerprint ? (
                  <span className="truncate">Fingerprint tracked</span>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {inventory.freshness === "stale" && hasCachedSuggestions && (
                <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 flex gap-2">
                  <AlertTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Inventory changed since this cache was generated. Refresh to
                    update matches.
                  </span>
                </div>
              )}
              {inventory.freshness === "fresh" && hasCachedSuggestions && (
                <div className="rounded-lg border border-emerald-300/60 bg-emerald-50 p-3 text-sm text-emerald-900 flex gap-2">
                  <CheckCircle2Icon className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Cached recommendations match your latest inventory snapshot.
                  </span>
                </div>
              )}
              {inventory.freshness === "unknown" && hasCachedSuggestions && (
                <div className="rounded-lg border border-muted p-3 text-sm text-muted-foreground">
                  Could not verify cache freshness. Showing stored
                  recommendations.
                </div>
              )}
              {inventory.error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {inventory.error}
                </div>
              )}
              {inventory.progressTimeline.length > 0 && (
                <ExecutionTimeline
                  steps={inventory.progressTimeline}
                  heading="Recommendation generation progress"
                  defaultExpanded={inventory.loading}
                />
              )}
              {!hasCachedSuggestions && !inventory.loading && (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Generate best pantry matches once, then they stay cached in
                  your browser until you refresh.
                </div>
              )}
              {inventory.loading && (
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-muted animate-pulse" />
                  <div className="h-20 rounded-lg bg-muted animate-pulse" />
                  <div className="h-20 rounded-lg bg-muted animate-pulse" />
                </div>
              )}
              {!inventory.loading &&
                inventory.suggestions.map((recipe) => (
                  <button
                    key={`inventory-best-${recipe.id}`}
                    type="button"
                    className="w-full text-left rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                    onClick={() => void recipeDetail.open(recipe)}
                  >
                    <div className="flex items-start gap-3">
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          className="h-16 w-16 rounded-md border object-cover shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-md border bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0">
                          <ChefHatIcon className="h-5 w-5 text-orange-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium line-clamp-2">
                          {recipe.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="text-[11px]">
                            Available:{" "}
                            {recipe.usedIngredientCount ??
                              recipe.usedIngredients?.length ??
                              0}
                          </Badge>
                          <Badge variant="outline" className="text-[11px]">
                            Missing:{" "}
                            {recipe.missingIngredientCount ??
                              recipe.missingIngredients?.length ??
                              0}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                          {recipe.summary}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* Recipe Ideas Grid */}
        <Card className="border-orange-100">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-xl">Recipe ideas</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChatOpen(true)}
                className="gap-1.5"
              >
                <MessageCircleIcon className="w-3.5 h-3.5" />
                Ask Assistant
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Search MealDB by dish style, goal, or ingredient names.
            </p>
          </CardHeader>
          <CardContent>
            {recipeSearch.searchError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive mb-4">
                {recipeSearch.searchError}
              </div>
            )}
            {recipeSearch.results.length === 0 && !recipeSearch.searching && (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Use search or quick tags to load recipe cards.
              </div>
            )}
            {recipeSearch.searching && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`search-skeleton-${index}`}
                    className="h-72 rounded-xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            )}
            {!recipeSearch.searching && recipeSearch.results.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recipeSearch.results.map((recipe) => (
                  <RecipeCard
                    key={`recipe-card-${recipe.id}`}
                    recipe={recipe}
                    onView={(selected) => void recipeDetail.open(selected)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat FAB */}
      {!chatOpen && (
        <Button
          className="fixed bottom-6 right-6 z-40 rounded-full shadow-xl h-12 px-4"
          onClick={() => setChatOpen(true)}
        >
          <MessageCircleIcon className="w-5 h-5 mr-1.5" />
          Chat
        </Button>
      )}

      <AssistantPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title="Recipe Assistant"
        subtitle="Connected to SAM for live recipe guidance."
        messages={chat.messages}
        activeTimeline={chat.activeTimeline}
        input={chat.input}
        onInputChange={chat.setInput}
        onSend={() => void chat.send()}
        sending={chat.sending}
        suggestions={QUICK_TAGS}
        onSuggestionClick={handleQuickSuggestion}
      />

      <RecipeDetailsDialog
        open={!!recipeDetail.selectedRecipe}
        selectedRecipe={recipeDetail.selectedRecipe}
        recipeDetails={recipeDetail.details}
        detailLoading={recipeDetail.loading}
        detailError={recipeDetail.error}
        onOpenChange={(open) => {
          if (!open) recipeDetail.close();
        }}
      />
    </div>
  );
}
