# Recipe Features Expansion Plan (Spoonacular-Mapped)

Last updated: 2026-03-09
Source: https://spoonacular.com/food-api/docs

## Goal

Expand the current `RecipeLookup + RecipeResearchAgent` into a richer, inventory-aware cooking assistant with reliable outputs, stronger ranking, and actionable shopping handoff.

## Phase 1 - Harden Current Recipe Flow

- [ ] Replace "top-3 only" logic with configurable `N` and ranking strategy.
- [ ] Introduce `complexSearch` path for richer filters (diet, cuisine, intolerances, maxReadyTime, include/exclude ingredients).
- [ ] Standardize final recipe payload schema (strict JSON contract for frontend).
- [ ] Add fallback chain for retrieval:
  - [ ] `complexSearch`
  - [ ] fallback `findByIngredients`
  - [ ] fallback random/suggested recipes
- [ ] Add transparent scoring fields per recipe:
  - [ ] pantry_coverage_score
  - [ ] missing_ingredient_count
  - [ ] prep_time_score
  - [ ] preference_match_score

Spoonacular endpoints:
- `GET /recipes/complexSearch`
- `GET /recipes/findByIngredients`
- `GET /recipes/{id}/information`

### Scoring Model v1 (Implementation Contract)

- [ ] Define `pantry_coverage_score`:
  - [ ] Range: `0.0` to `1.0`.
  - [ ] Formula: `used_required_ingredients / total_required_ingredients`.
  - [ ] Quantity-aware upgrade (optional): average of `min(inventory_amount_i / required_amount_i, 1.0)` across required ingredients.
- [ ] Define `missing_ingredient_count`:
  - [ ] Integer count of required ingredients not satisfied by pantry after normalization/substitution checks.
  - [ ] Lower is better.
- [ ] Define `prep_time_score`:
  - [ ] Range: `0.0` to `1.0`.
  - [ ] Inputs: user target time `T` and recipe time `t`.
  - [ ] Formula:
    - [ ] If `t <= T`: `1.0`
    - [ ] Else: `max(0, 1 - (t - T)/T)`
- [ ] Define `preference_match_score`:
  - [ ] Range: `0.0` to `1.0`.
  - [ ] Weighted satisfaction across user preferences (diet, intolerances, cuisine, meal type, disliked ingredients, macro goals).
  - [ ] Hard constraints (e.g., intolerances/allergies) disqualify recipes instead of soft-penalizing.
- [ ] Define composite `final_score`:
  - [ ] `0.45*pantry_coverage_score + 0.25*preference_match_score + 0.20*prep_time_score + 0.10*(1 - normalized_missing_count)`
  - [ ] Keep weights configurable in agent config.
- [ ] Return structured scoring payload per recipe:
  - [ ] `scores.pantry_coverage_score`
  - [ ] `scores.missing_ingredient_count`
  - [ ] `scores.prep_time_score`
  - [ ] `scores.preference_match_score`
  - [ ] `scores.final_score`
  - [ ] `explanation` (short human-readable reason string)

## Phase 2 - Ingredient Intelligence

- [ ] Add ingredient parser for user free text before recipe search.
- [ ] Add unit conversion normalization service for ingredient comparisons.
- [ ] Add substitutions engine for missing ingredients.
- [ ] Add "can I swap X with Y?" assistant command.
- [ ] Add "compute needed amount" utility from servings changes.

Spoonacular endpoints:
- `POST /recipes/parseIngredients`
- `POST /recipes/convert`
- `GET /food/ingredients/substitutes`
- `GET /food/ingredients/{id}/substitutes`
- `GET /food/ingredients/{id}/amount`

## Sources

- https://spoonacular.com/food-api/docs
