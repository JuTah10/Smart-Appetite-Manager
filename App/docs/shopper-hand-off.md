
## Phase 5 - Meal Planning + Shopper Handoff

- [ ] Integrate user-scoped meal planner workflow.
- [ ] Add "add selected recipe to plan" from recipe details.
- [ ] Generate shopping list from planned meals.
- [ ] Merge missing ingredients with existing pantry quantities.
- [ ] Pass final missing list directly to `ShopperAgent`.

Spoonacular endpoints:
- `POST /users/connect`
- Meal planner endpoints (`/mealplanner/...`)
- Shopping list endpoints (`/mealplanner/{username}/shopping-list/...`)

## Phase 6 - Discovery and Engagement Extras

- [ ] Add recipe video support for selected recipes.
- [ ] Add cuisine classifier for unclear user requests.
- [ ] Add recipe query analyzer to convert natural language to structured search.
- [ ] Add optional wine pairing block.

Spoonacular endpoints:
- `GET /food/videos/search`
- `POST /recipes/cuisine`
- `GET /recipes/queries/analyze`
- `GET /food/wine/pairing`

## Engineering Contracts

- [ ] Define `RecipeCard` schema (search result contract).
- [ ] Define `RecipeDetails` schema (detail screen contract).
- [ ] Define `RecommendationReason` schema (scoring explainability).
- [ ] Add backend schema validation before response to UI.
- [ ] Add error taxonomy:
  - [ ] quota exceeded
  - [ ] rate limited
  - [ ] no recipes found
  - [ ] endpoint unavailable

## Acceptance Criteria

- [ ] User can request recipes using plain language and inventory context.
- [ ] Returned recipes are ranked and explainable.
- [ ] Missing ingredients are normalized and substitution-aware.
- [ ] User can move from recipe selection to shopping flow in one interaction chain.
- [ ] Frontend never depends on unstructured model text for core data rendering.
- [ ] Failures show actionable messages (not raw API dumps).
