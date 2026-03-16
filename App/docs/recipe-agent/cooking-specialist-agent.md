# Recipe Cooking Specialist Agent

Last updated: 2026-03-14

Status: **Future Implementation**

## Problem Statement

The Recipe system currently has three agents focused on **finding** recipes:

```
User → OrchestratorAgent → RecipeAssistant (router)
    ├── RecipeInventorySearch  (pantry-based recipe search)
    └── RecipeGeneralSearch    (cuisine/diet/random exploration + ingredient intelligence)
```

There's a gap: **no agent helps users while they're actively cooking a recipe**. The Cooking tab in the frontend has timers, notes, and YouTube video embeds — but zero AI assistance. Users who encounter problems mid-cook have no support.

### Current Pain Points

| Pain Point | Example | Current Workaround |
|-----------|---------|-------------------|
| Technique confusion | "How do I know when chicken is done?" | Leave the app, search Google |
| Ingredient emergency | "I'm out of buttermilk, what do I use?" | Leave the app, search Google |
| Equipment mismatch | "I don't have a whisk, what else works?" | Guess or leave the app |
| Temperature confusion | "Recipe says 375F conventional, I have convection" | Guess |
| Timing coordination | "When should I start the rice if the chicken takes 25min?" | Mental math |
| Troubleshooting | "My sauce is too thick, how to fix it?" | Leave the app, search Google |
| Flavor fix | "My soup tastes too salty" | Guess |
| Food safety | "Is this chicken safe to eat?" | Leave the app, search Google |

Every time a user leaves the app to search for cooking help, they lose context and risk burning food.

## Solution: RecipeCookingSpecialist Agent

A new specialist agent, orchestrated by RecipeAssistant (same pattern as RecipeGeneralSearch and RecipeInventorySearch), that provides real-time cooking assistance.

### Updated Architecture

```
User → OrchestratorAgent → RecipeAssistant (router) → classifies intent:
    ├── RecipeInventorySearch    (pantry-based recipe search)
    ├── RecipeGeneralSearch      (cuisine/diet/random + ingredient intelligence)
    └── RecipeCookingSpecialist  (active cooking assistance)  <-- NEW
```

### Agent Design

| Property | Value |
|----------|-------|
| **Agent Name** | `RecipeCookingSpecialist` |
| **Display Name** | `Cooking Specialist` |
| **Model** | `*general_model` (specialist, not router) |
| **Session** | Persistent SQL (`sqlite:///cooking_specialist.db`) |
| **Response Style** | Short, actionable, concise — user is actively cooking |
| **Inter-agent** | `allow_list: ["OrchestratorAgent", "RecipeAssistant"]` |
| **Orchestrated by** | RecipeAssistant (via `peer_RecipeCookingSpecialist`) |

### Why Persistent Sessions?

The cooking specialist needs to remember which recipe the user is cooking across multiple questions. If a user asks "is the chicken done?" followed by "what about the sauce?", the agent must retain context about the full recipe. Persistent SQL sessions (same pattern as RecipeAssistant) enable this.

## Features

### Core Features

#### 1. Technique Guidance & Troubleshooting

Real-time help with cooking techniques and fixing problems as they happen.

**Examples:**
- "How do I julienne carrots?"
- "My sauce is too thick, what should I do?"
- "How do I know when chicken is done?"
- "What's the difference between sauteing and pan-frying?"
- "My caramel crystallized, can I save it?"
- "How do I fold egg whites without deflating them?"

**Approach:** LLM knowledge for common techniques, `web_request_tools` for advanced/unusual problems.

#### 2. Ingredient Substitutions & Conversions

Find replacements for missing ingredients and convert between measurement units.

**Examples:**
- "I don't have buttermilk, what can I use?"
- "Substitute for heavy cream in this pasta sauce?"
- "How many grams is 2 cups of flour?"
- "I want to double this recipe, what are the new amounts?"
- "Can I use dried herbs instead of fresh? How much?"

**Approach:** `get_substitutes` tool for structured Spoonacular data, `convert_amounts` tool for unit conversions, LLM knowledge for ratio/scaling guidance.

#### 3. Step-by-Step Cooking Guidance

Walk the user through recipe steps with timing and parallel prep suggestions.

**Examples:**
- "Walk me through making the roux"
- "What should I prep while the onions caramelize?"
- "I'm at step 3, can you explain what 'deglaze' means?"
- "What's the order of operations for this stir-fry?"
- "When should I start boiling the pasta if the sauce takes 20 minutes?"

**Approach:** LLM reasoning over the recipe instructions (received via context from RecipeAssistant). Suggests parallel workflows to save time.

#### 4. Equipment & Temperature Advice

Help with equipment alternatives and temperature adjustments.

**Examples:**
- "I don't have a whisk, what else can I use?"
- "Can I use a regular pan instead of a cast iron skillet?"
- "Recipe says 375F conventional, I have convection — what temp?"
- "Can I use a blender instead of a food processor?"
- "What size pot do I need for this amount of pasta?"

**Approach:** LLM knowledge for equipment alternatives and standard temperature conversion rules.

### Additional Features

#### 5. Flavor Profiling & Seasoning Fixes

Help balance and fix flavors during cooking.

**Examples:**
- "My dish tastes bland, what should I add?"
- "My soup is too salty, how do I fix it?"
- "When should I add the fresh herbs — now or at the end?"
- "How do I balance the sweetness in this curry?"
- "My stir-fry sauce is too sweet, what can I add?"

**Approach:** LLM knowledge of flavor science. Provides practical fixes (acid to balance salt, starch to absorb excess seasoning, etc.).

#### 6. Dietary Adaptation On-the-Fly

Modify a recipe mid-cook to accommodate dietary needs.

**Examples:**
- "How do I make this gluten-free right now?"
- "I'm skipping the dairy, what do I adjust?"
- "My guest is allergic to nuts, what should I change?"
- "Can I make this vegan if I skip the eggs?"

**Approach:** LLM reasoning about the recipe context + `get_substitutes` tool for structured alternatives.

#### 7. Storage & Leftover Guidance

Help with post-cooking storage and reheating.

**Examples:**
- "How should I store the leftovers?"
- "How long will this keep in the fridge?"
- "Can I freeze this sauce?"
- "What's the best way to reheat this pasta?"
- "Should I store the sauce separately from the pasta?"

**Approach:** LLM knowledge of food storage best practices, `web_request_tools` for specific/unusual storage questions.

#### 8. Plating & Presentation Tips

Suggestions for making dishes look great.

**Examples:**
- "How should I plate this steak dinner?"
- "What garnish goes well with this soup?"
- "Any tips for making this salad look restaurant-quality?"
- "How do I drizzle sauce artistically?"

**Approach:** LLM knowledge of plating techniques and garnish pairings.

#### 9. Allergen Awareness

Identify potential allergens and suggest safe alternatives.

**Examples:**
- "Does this recipe contain any common allergens?"
- "Is there hidden gluten in any of these ingredients?"
- "I'm cooking for someone with a tree nut allergy — anything to watch out for?"
- "Is this soy sauce gluten-free?"

**Approach:** LLM knowledge of common allergens in ingredients, `web_request_tools` for specific product/ingredient verification.

## Tools

| Tool | Source | Purpose |
|------|--------|---------|
| `web_request_tools` | SAM builtin-group | Web search for techniques, troubleshooting, real-time info |
| `get_substitutes` | `recipe_agent.mealdb_tools` (existing) | Structured ingredient substitution data from Spoonacular |
| `convert_amounts` | `recipe_agent.mealdb_tools` (existing) | Unit conversions (cups to grams, etc.) from Spoonacular |

**No new Python tool files needed.** Both `get_substitutes` and `convert_amounts` already exist in `src/recipe_agent/mealdb_tools.py`. The `web_request_tools` is a SAM built-in group.

### When to Use Each Tool

| User Question Type | Primary Tool | Fallback |
|-------------------|-------------|----------|
| Ingredient substitution | `get_substitutes` | LLM knowledge |
| Unit conversion | `convert_amounts` | LLM knowledge |
| Advanced technique | `web_request_tools` | LLM knowledge |
| Troubleshooting unusual problem | `web_request_tools` | LLM knowledge |
| Food safety specifics | `web_request_tools` | LLM knowledge |
| Common technique, timing, equipment | LLM knowledge (no tool needed) | `web_request_tools` |
| Flavor fixes, plating, dietary | LLM knowledge (no tool needed) | `web_request_tools` |

## Agent Instruction Design

Key principles for the agent's system prompt:

1. **You are a real-time cooking assistant** helping users while they actively cook a specific recipe
2. **Recipe context**: You receive recipe context (title, ingredients, instructions) from RecipeAssistant when delegated to. Use this context to give recipe-specific answers.
3. **Concise responses**: The user has food on the stove. Keep answers short, actionable, and numbered when step-by-step.
4. **Tool usage priority**:
   - Use `get_substitutes` for ingredient swap questions
   - Use `convert_amounts` for measurement conversions
   - Use `web_request_tools` for advanced techniques, unusual problems, or when your knowledge isn't sufficient
   - For common cooking knowledge, respond directly without tools (faster)
5. **NEVER suggest starting a different recipe** — help the user succeed with what they're making
6. **Tool Output Rules**: Use EXACT data from tool responses. Never fabricate substitutes, conversions, or web search results.
7. **Cover all 9 feature areas** in your expertise: techniques, substitutions, step-by-step guidance, equipment, flavor fixes, dietary adaptation, storage, plating, allergens

### Response Format

Unlike RecipeGeneralSearch and RecipeInventorySearch, the Cooking Specialist does **NOT** return `recipe_data` JSON blocks. Its responses are purely conversational — short, practical answers to help the user cook.

**Example good response (technique):**
```
Your chicken is done when:
1. Internal temp reaches **165F (74C)** — use a meat thermometer in the thickest part
2. Juices run clear when you cut into the thickest piece
3. No pink remains in the center

Since your recipe has you pan-searing at medium-high, this should take about **6-7 minutes per side** for a standard breast.
```

**Example good response (substitution):**
```
For buttermilk, mix:
- **1 cup milk + 1 tbsp lemon juice** (or white vinegar)
- Stir and let sit 5 minutes before using

This works perfectly for your pancake batter.
```

## YAML Configuration

**File:** `App/configs/agents/recipe_cooking_specialist.yaml`

```yaml
log:
  stdout_log_level: INFO

!include ../shared_config.yaml

apps:
  - name: recipe-cooking-specialist_app
    app_base_path: .
    app_module: solace_agent_mesh.agent.sac.app

    broker:
      <<: *broker_connection

    app_config:
      namespace: ${NAMESPACE, sam/}
      supports_streaming: true
      agent_name: "RecipeCookingSpecialist"
      display_name: "Cooking Specialist"
      model: *general_model
      agent_init_function:
        module: "rate_limit_init"
        name: "setup_llm_rate_limit"
        base_path: "src"
        config:
          wait_seconds: ${LLM_MIN_CALL_INTERVAL_SECONDS, 1.0}

      instruction: |
        You are the Cooking Specialist — a real-time cooking assistant that helps users
        while they are actively cooking a specific recipe. You receive recipe context
        (title, ingredients, instructions) from the RecipeAssistant when delegated to.

        YOUR EXPERTISE (respond to any of these):

        1. TECHNIQUE GUIDANCE & TROUBLESHOOTING
           Help with cooking techniques and fix problems as they happen.
           Examples: "how to julienne", "my sauce is too thick", "how do I know when chicken is done?"

        2. INGREDIENT SUBSTITUTIONS & CONVERSIONS
           Find replacements and convert measurements.
           - Use `get_substitutes` for ingredient swap data
           - Use `convert_amounts` for unit conversions (cups to grams, etc.)
           Examples: "substitute for buttermilk", "how many grams is 2 cups flour"

        3. STEP-BY-STEP COOKING GUIDANCE
           Walk through recipe steps, explain timing, suggest parallel prep.
           Examples: "walk me through making the roux", "what should I prep while onions caramelize?"

        4. EQUIPMENT & TEMPERATURE ADVICE
           Alternative equipment and temperature adjustments.
           Examples: "no whisk, what else?", "convection oven temp for 375F conventional?"

        5. FLAVOR PROFILING & SEASONING FIXES
           Help balance and fix flavors during cooking.
           Examples: "dish tastes bland", "soup too salty", "when to add fresh herbs?"

        6. DIETARY ADAPTATION ON-THE-FLY
           Modify a recipe mid-cook for dietary needs.
           Examples: "make this gluten-free right now", "skip the dairy, what to adjust?"

        7. STORAGE & LEFTOVER GUIDANCE
           Post-cooking storage and reheating advice.
           Examples: "how to store leftovers", "can I freeze this sauce?", "best way to reheat?"

        8. PLATING & PRESENTATION TIPS
           Make dishes look great with garnishing and plating techniques.
           Examples: "how to plate this steak dinner", "garnish ideas for this soup"

        9. ALLERGEN AWARENESS
           Identify allergens and suggest safe alternatives.
           Examples: "does this have common allergens?", "hidden gluten in these ingredients?"

        RESPONSE RULES:
        - Keep answers SHORT and ACTIONABLE — the user has food on the stove
        - Use numbered steps when explaining procedures
        - Include specific temperatures, times, and measurements when relevant
        - Use bold for key values (temperatures, times, quantities)
        - NEVER suggest starting a different recipe — help the user succeed with what they're making
        - For common cooking knowledge, respond directly WITHOUT calling tools (faster response)
        - Only use `web_request_tools` for advanced techniques, unusual problems, or when unsure

        TOOL OUTPUT RULES:
        - WAIT for tool results before responding
        - Use EXACT values from tool responses
        - NEVER fabricate substitutes, conversions, or web search results
        - If a tool fails, say so — don't make up an answer

      tools:
        # Web search for advanced techniques and troubleshooting
        - tool_type: builtin-group
          group_name: web_request_tools

        # Ingredient substitution (Spoonacular)
        - tool_type: python
          component_base_path: "src"
          component_module: "recipe_agent.mealdb_tools"
          function_name: "get_substitutes"

        # Unit conversion (Spoonacular)
        - tool_type: python
          component_base_path: "src"
          component_module: "recipe_agent.mealdb_tools"
          function_name: "convert_amounts"

      session_service:
        type: "sql"
        database_url: "${COOKING_SPECIALIST_DATABASE_URL, sqlite:///cooking_specialist.db}"
        default_behavior: "PERSISTENT"

      artifact_service: *default_artifact_service

      agent_card:
        description: >
          Cooking Specialist — Real-time cooking assistant for users actively cooking
          a specific recipe. Helps with cooking techniques ("how to julienne", "is my
          chicken done?"), troubleshooting ("sauce too thick", "soup too salty"),
          ingredient substitutions ("what replaces buttermilk?"), unit conversions
          ("cups to grams"), step-by-step guidance ("walk me through the roux"),
          equipment alternatives ("no whisk, what else?"), temperature adjustments
          ("convection oven temp?"), flavor fixes ("dish tastes bland"), dietary
          adaptation ("make this gluten-free"), storage and leftovers ("how to store",
          "can I freeze this?"), plating tips, and allergen awareness. Use this agent
          when the user needs help WHILE COOKING, not when searching for new recipes.
        defaultInputModes: ["text"]
        defaultOutputModes: ["text"]
        skills:
          - id: "cooking_technique_help"
            name: "Cooking Technique Help"
            description: "Provide guidance on cooking techniques, troubleshooting, and food safety."
          - id: "cooking_substitution"
            name: "Cooking Substitution & Conversion"
            description: "Find ingredient substitutes and convert measurement units during cooking."
          - id: "cooking_step_guidance"
            name: "Step-by-Step Cooking Guidance"
            description: "Walk through recipe steps, timing coordination, and parallel prep suggestions."

      agent_card_publishing:
        interval_seconds: 10

      agent_discovery:
        enabled: true

      inter_agent_communication:
        allow_list: ["OrchestratorAgent", "RecipeAssistant"]
        request_timeout_seconds: 60
```

## Changes to RecipeAssistant Router

**File:** `App/configs/agents/recipe_assistant.yaml`

### New Intent: COOKING_ASSISTANCE

Add as the 5th intent in STEP 1 — INTENT CLASSIFICATION:

```
5) COOKING_ASSISTANCE — The user needs help while actively cooking a specific recipe.
   This includes cooking techniques, troubleshooting, temperature/equipment questions,
   flavor fixes, step-by-step guidance, dietary adaptations, storage advice, or
   plating tips.
   Trigger phrases: "my sauce is too thick", "how do I know when the chicken is done?",
   "can I substitute yogurt for sour cream in this?", "what temperature for convection
   oven?", "I don't have a whisk", "how to fix oversalted soup", "how long to rest
   the steak", "walk me through making the roux", "is this safe to eat?", "how to
   store leftovers", "my dish tastes bland", "make this gluten-free",
   "how should I plate this?"
   → Delegate to peer_RecipeCookingSpecialist.
```

### Routing Heuristic

| Intent | Signal | Agent |
|--------|--------|-------|
| GENERAL_RECIPE_SEARCH | "Find me a recipe" (searching) | RecipeGeneralSearch |
| COOKING_ASSISTANCE | "Help me cook this recipe" (doing) | RecipeCookingSpecialist |
| INGREDIENT_INTELLIGENCE | Quick factual lookup (substitute/convert, NOT mid-cook) | RecipeGeneralSearch |

**Overlap handling:** INGREDIENT_INTELLIGENCE and COOKING_ASSISTANCE can overlap. The key differentiator:
- If the user seems to be **mid-cook** (mentions cooking, stove, oven, "right now", references a recipe they're making) → COOKING_ASSISTANCE
- If it's a **standalone factual question** ("can I substitute X for Y?" with no cooking context) → INGREDIENT_INTELLIGENCE

### Updated allow_list

```yaml
inter_agent_communication:
  allow_list: ["OrchestratorAgent", "RecipeInventorySearch", "RecipeGeneralSearch", "RecipeCookingSpecialist"]
  request_timeout_seconds: 120
```

### Delegation Context

When delegating to RecipeCookingSpecialist, RecipeAssistant should include:
- The user's original question
- Any recipe context from the conversation (if the user previously searched for a recipe)
- Example: "The user is cooking Chicken Teriyaki (ID: 52772) and asks: 'My sauce is too thick, what do I do?'"

## Frontend Registration

**File:** `App/web/src/api/agents.js`

Add to the AGENTS constant:

```js
export const AGENTS = {
  // ... existing entries ...
  RECIPE_COOKING: "RecipeCookingSpecialist",
};
```

## Test Scenarios

### Tier 1: Core Cooking Assistance

| # | User Message | Expected Intent | Expected Agent | Expected Behavior |
|---|-------------|----------------|----------------|-------------------|
| 1 | "How do I know when my chicken is done?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | LLM knowledge: 165F internal temp, clear juices, no pink |
| 2 | "My sauce is too thick, what do I do?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | LLM knowledge: add liquid (stock, water, cream) gradually |
| 3 | "I don't have buttermilk, what can I use?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | `get_substitutes("buttermilk")` → milk + lemon juice |
| 4 | "How many grams is 2 cups of flour?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | `convert_amounts("flour", 2, "cups", "grams")` → ~240g |
| 5 | "I don't have a whisk, what else can I use?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | LLM knowledge: fork, chopsticks, jar with lid to shake |

### Tier 2: Step-by-Step & Timing

| # | User Message | Expected Intent | Expected Agent | Expected Behavior |
|---|-------------|----------------|----------------|-------------------|
| 6 | "Walk me through making the roux" | COOKING_ASSISTANCE | RecipeCookingSpecialist | Step-by-step: equal parts butter + flour, cook 2-3 min for white roux |
| 7 | "What should I prep while the onions caramelize?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | Suggest parallel prep based on recipe context |
| 8 | "When should I start the pasta if the sauce takes 20 min?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | Timing math: start pasta 10 min in (10 min boil + drain) |

### Tier 3: Temperature & Equipment

| # | User Message | Expected Intent | Expected Agent | Expected Behavior |
|---|-------------|----------------|----------------|-------------------|
| 9 | "Recipe says 375F conventional, I have convection" | COOKING_ASSISTANCE | RecipeCookingSpecialist | LLM: reduce 25F → 350F, may need less time |
| 10 | "Can I use a regular pan instead of cast iron?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | LLM: yes but adjust heat, may not get same sear |

### Tier 4: Flavor & Dietary

| # | User Message | Expected Intent | Expected Agent | Expected Behavior |
|---|-------------|----------------|----------------|-------------------|
| 11 | "My soup is too salty, how do I fix it?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | LLM: add potato to absorb, add acid, dilute with unsalted stock |
| 12 | "How do I make this gluten-free right now?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | `get_substitutes` for flour alternatives + LLM adaptation advice |
| 13 | "My dish tastes bland, what should I add?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | LLM: acid (lemon/vinegar), salt, umami (soy sauce), fat |

### Tier 5: Storage, Safety & Allergens

| # | User Message | Expected Intent | Expected Agent | Expected Behavior |
|---|-------------|----------------|----------------|-------------------|
| 14 | "How long will leftovers keep in the fridge?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | LLM knowledge: 3-4 days typical, depends on ingredients |
| 15 | "Is my chicken safe if it's slightly pink near the bone?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | LLM: internal temp is what matters (165F), bone-area pinkness can be normal |
| 16 | "Does this recipe have hidden allergens?" | COOKING_ASSISTANCE | RecipeCookingSpecialist | LLM analysis of recipe ingredients for common allergens |

### Tier 6: Routing Correctness (should NOT go to CookingSpecialist)

| # | User Message | Expected Intent | Expected Agent |
|---|-------------|----------------|----------------|
| 17 | "Find me pasta recipes" | GENERAL_RECIPE_SEARCH | RecipeGeneralSearch |
| 18 | "What can I cook from my inventory?" | INVENTORY_RECIPE_SEARCH | RecipeInventorySearch |
| 19 | "Show me Italian recipes under 30 min" | GENERAL_RECIPE_SEARCH | RecipeGeneralSearch |
| 20 | "Get details for meal ID 52772" | RECIPE_DETAILS | RecipeGeneralSearch |

## Files Modified Summary

### New Files

| File | Description |
|------|-------------|
| `App/configs/agents/recipe_cooking_specialist.yaml` | Agent YAML configuration |
| `App/docs/recipe-agent/cooking-specialist-agent.md` | This documentation file |

### Modified Files

| File | Change |
|------|--------|
| `App/configs/agents/recipe_assistant.yaml` | Add COOKING_ASSISTANCE (5th intent), update `allow_list` |
| `App/web/src/api/agents.js` | Add `RECIPE_COOKING: "RecipeCookingSpecialist"` |

### Existing Files Reused (No Modifications)

| File | What's Reused |
|------|--------------|
| `App/src/recipe_agent/mealdb_tools.py` | `get_substitutes`, `convert_amounts` tools |
| `App/configs/shared_config.yaml` | `*broker_connection`, `*general_model`, `*default_artifact_service` anchors |

## Updated File Layout

```
App/
├── configs/agents/
│   ├── recipe_assistant.yaml              # Router agent (no tools) — MODIFIED: add 5th intent
│   ├── recipe_general_search.yaml         # General search agent (9 tools)
│   ├── recipe_inventory_search.yaml       # Inventory search agent (6 tools)
│   └── recipe_cooking_specialist.yaml     # Cooking specialist agent (3 tools) — NEW
├── src/recipe_agent/
│   └── mealdb_tools.py                    # Spoonacular API tools (reused: get_substitutes, convert_amounts)
├── web/src/api/
│   └── agents.js                          # Agent name registry — MODIFIED: add RECIPE_COOKING
└── docs/recipe-agent/
    ├── recipe-agent-architecture.md       # Architecture overview
    ├── cooking-specialist-agent.md        # This file — NEW
    ├── recipe-finder-intelligent-search.md
    ├── general-search-scenarios.md
    └── recipe-search-scenarios.md
```

## Verification Plan

1. **Agent registration**: Run `uv run sam run configs/` and verify `RecipeCookingSpecialist` appears in agent discovery logs
2. **Routing test**: Ask RecipeAssistant cooking-related questions and verify delegation:
   - "My sauce is too thick" → COOKING_ASSISTANCE → RecipeCookingSpecialist
   - "Find me pasta recipes" → GENERAL_RECIPE_SEARCH → RecipeGeneralSearch (unchanged)
   - "What can I cook?" → INVENTORY_RECIPE_SEARCH → RecipeInventorySearch (unchanged)
3. **Tool test**: Ask substitution/conversion questions and verify Spoonacular tools fire:
   - "Substitute for buttermilk?" → calls `get_substitutes`
   - "How many grams in 2 cups flour?" → calls `convert_amounts`
4. **Web search test**: Ask advanced technique question and verify `web_request_tools` is used:
   - "How do I temper chocolate properly?" → web search for technique
5. **Session persistence**: Verify recipe context is maintained across messages in same session
6. **Run all Tier 1-6 test scenarios** from the table above
