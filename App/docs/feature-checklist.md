# Smart Appetite Manager - Feature Checklist

## Inventory Management

### Implemented Now
- [ ] Add item(s) via natural language
- [ ] Auto-deduplicate by `(product_name + quantity_unit + unit)` and increase quantity
- [ ] Increase stock for existing item
- [ ] Decrease stock with underflow protection
- [ ] Delete item permanently
- [ ] List inventory items
- [ ] Get ingredient-name projection for recipe workflows
- [ ] Auto-create/auto-migrate inventory schema
- [ ] Normalize unit aliases (kg/g/L/ml/unit, etc.)
- [ ] Handle ambiguous item matches safely

### Core Next
- [ ] Require authorization for increase/decrease mutations
- [ ] Require elevated authorization for delete
- [ ] Add soft-delete and restore window
- [ ] Add expiration tracking and low-stock alerts

### Future
- [ ] Barcode scan to item mapping
- [ ] Batch pantry normalization suggestions

---

## Recipe Features (RecipeLookup + RecipeResearchAgent)

### Implemented Now
- [ ] Suggest top recipes from current inventory
- [ ] Show used vs missing ingredient counts
- [ ] Fetch full recipe details (ingredients + instructions)
- [ ] Conversational flow: inventory -> options -> select -> details -> ask for deals
- [ ] Recipe discovery UI with cached pantry recommendations
- [ ] Recipe assistant chat panel with execution timeline

### Core Next
- [ ] Define unified recipe source strategy (Spoonacular + MealDB fallback)
- [ ] Define recommendation scoring contract (coverage, missing count, time, preferences)
- [ ] Add cook mode (step tracking + timers)
- [ ] Enforce strict JSON schema for recipe-agent outputs
- [ ] Add advanced recipe filters (diet, cuisine, intolerances, max ready time)
- [ ] Add ingredient parsing and unit conversion before search
- [ ] Add substitution suggestions for missing ingredients
- [ ] Add servings scaler with updated ingredient amounts
- [ ] Add natural-language query analyzer to structured search
- [ ] Add nutrition-aware discovery (macro/calorie ranges)
- [ ] Define quota-aware endpoint fallback strategy

### Future
- [ ] Multi-day meal planning calendar
- [ ] Nutrition/macro-aware ranking
- [ ] Leftover-aware next-meal suggestions
- [ ] User-scoped meal planner integration (calendar + templates)
- [ ] Auto-generated shopping list from selected/planned meals
- [ ] Video-based recipe walkthrough support
- [ ] Wine pairing recommendations
- [ ] Image-based nutrition estimation for custom dishes

---

## Shopper Agent Features

### Implemented Now
- [ ] Single-item local flyer lookup
- [ ] Batch deal search for ingredient lists
- [ ] Fallback to standard-price estimate
- [ ] Validate store locality via Maps lookup
- [ ] Generate one-stop-shop recommendations

### Core Next
- [ ] Define canonical `shopping_plan` response schema
- [ ] Add optimization modes (cheapest total / fewest stores / nearest)
- [ ] Handle out-of-stock uncertainty + substitutions
- [ ] Add user constraints (preferred stores, max distance, budget, exclusions)

### Future
- [ ] Route-aware multi-store itinerary
- [ ] Price history + alerts
- [ ] Household basket templates + auto-refill suggestions
