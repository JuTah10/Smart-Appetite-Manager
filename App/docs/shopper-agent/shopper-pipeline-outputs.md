# Shopper Pipeline — Function Outputs Reference

This documents the return value of every function in `src/shopper_agent/shopper_tools.py`, showing what data flows between each step.

---

## Pipeline Overview

```
User: "Find deals on cheddar cheese, broccoli, pasta, orange juice"

┌─────────────────────────────────────────────────────────────────────┐
│  find_deals_for_planning (orchestrates steps 1–5 internally)       │
│                                                                     │
│  Step 1: fetch_flipp_raw          — Flipp API call                 │
│  Step 2: filter_flipp_results     — LLM removes junk products     │
│  Step 2b: enrich_flipp_results    — LLM adds detail tags           │
│  Step 3: tag_price_types          — deterministic price tagging    │
│  Step 3b: select_walmart_baselines — LLM picks baseline products   │
│  Step 4: build_store_comparison   — builds store × item matrix     │
│  Step 5: find_nearby_stores       — geocodes stores via Overpass   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ returns store_comparison to LLM
                           ▼
              LLM reads data, picks stores + items
                           │
          ┌────────────────┴────────────────┐
          ▼                                 ▼
  format_deals_overview()        format_shopping_plan(plan_items, reasoning)
  (collapsible all-deals)        (summary table with images)
```

---

## Step 1: `fetch_flipp_raw`

**Called by:** `find_deals_for_planning` internally
**Input:** `items = ["cheddar cheese", "broccoli", "pasta", "orange juice"]`
**Output:**

```json
{
  "status": "success",
  "raw_metrics": {
    "cheddar cheese": {
      "flyer": [
        {
          "name": "FROMAGE EXTRA CHEDDAR KRAFT | KRAFT EXTRA CHEDDAR CHEESE",
          "store": "Super C",
          "price": 3.97,
          "post_price_text": "",
          "pre_price_text": "",
          "original_price": null,
          "sale_story": "3,32$ d'économie",
          "valid_to": "2026-03-19",
          "image_url": "https://f.wishabi.net/page_items/412495081/...",
          "store_logo": "https://f.wishabi.net/merchants/3194/..."
        },
        {
          "name": "Balderson Cheddar Cheese",
          "store": "FreshCo",
          "price": 6.99,
          "...": "..."
        }
      ],
      "ecom": [
        {
          "name": "Black Diamond Original Cheddar Cheese Slices",
          "store": "Walmart",
          "price": 3.47,
          "original_price": null,
          "store_logo": "https://..."
        }
      ]
    },
    "broccoli": { "flyer": [...], "ecom": [...] },
    "pasta": { "flyer": [...], "ecom": [...] },
    "orange juice": { "flyer": [...], "ecom": [...] }
  }
}
```

**Key points:**
- `flyer` = items from store flyers (weekly deals)
- `ecom` = online store prices (regular prices, not deals)
- Non-grocery stores and non-food categories are pre-filtered out

---

## Step 2: `filter_flipp_results`

**Called by:** `find_deals_for_planning` internally
**Input:** `raw_metrics` from Step 1
**Uses LLM:** Yes — generates per-item exclude lists to remove irrelevant products
**Output:**

```json
{
  "status": "success",
  "filtered_metrics": {
    "cheddar cheese": {
      "flyer": [
        { "name": "FROMAGE EXTRA CHEDDAR KRAFT", "store": "Super C", "price": 3.97, "..." : "..." },
        { "name": "Balderson Cheddar Cheese", "store": "FreshCo", "price": 6.99, "..." : "..." }
      ],
      "ecom": [
        { "name": "Black Diamond Original Cheddar Cheese Slices", "store": "Walmart", "price": 3.47, "..." : "..." }
      ],
      "removed": [
        "CHEF BOYARDEE Cheddar Blast Pasta",
        "Goldfish Cheddar Crackers"
      ]
    },
    "broccoli": { "flyer": [...], "ecom": [...], "removed": [...] },
    "...": "..."
  }
}
```

**Key points:**
- Same structure as Step 1 but with irrelevant items removed
- `removed` list shows what was filtered out (for transparency/debugging)

---

## Step 2b: `enrich_flipp_results`

**Called by:** `find_deals_for_planning` internally
**Input:** `filtered_metrics` from Step 2
**Uses LLM:** Yes — classifies each product with a short detail tag
**Output:**

```json
{
  "status": "success",
  "enriched_metrics": {
    "cheddar cheese": {
      "flyer": [
        {
          "name": "FROMAGE EXTRA CHEDDAR KRAFT",
          "store": "Super C",
          "price": 3.97,
          "detail": "processed cheese slices",
          "...": "..."
        },
        {
          "name": "Balderson Cheddar Cheese",
          "store": "FreshCo",
          "price": 6.99,
          "detail": "aged block cheddar",
          "...": "..."
        }
      ],
      "ecom": [...],
      "removed": [...]
    },
    "...": "..."
  }
}
```

**Key points:**
- Adds a `detail` field to each item (2-5 words)
- Helps the LLM distinguish variants: "canned salmon" vs "fresh fillet", "clarified butter" vs "regular butter"
- Only enriches flyer items (ecom items are just for baseline pricing)

---

## Step 3: `tag_price_types`

**Called by:** `find_deals_for_planning` internally
**Input:** `enriched_metrics` from Step 2b
**Uses LLM:** No — pure deterministic regex on `post_price_text`
**Output:**

```json
{
  "status": "success",
  "tagged_metrics": {
    "cheddar cheese": {
      "flyer": [
        {
          "name": "St-Albert Cheese Co-Op Medium or Old Cheddar",
          "store": "Farm Boy",
          "price": 2.99,
          "post_price_text": "/100g",
          "price_type": "per_100g",
          "detail": "block cheddar per 100g",
          "...": "..."
        },
        {
          "name": "FROMAGE EXTRA CHEDDAR KRAFT",
          "store": "Super C",
          "price": 3.97,
          "price_type": "flat",
          "...": "..."
        }
      ],
      "ecom": [
        {
          "name": "Black Diamond Original Cheddar Cheese Slices",
          "store": "Walmart",
          "price": 3.47,
          "price_type": "flat"
        }
      ],
      "removed": [...]
    },
    "broccoli": {
      "flyer": [
        {
          "name": "Broccoli Crowns Product of USA or Mexico",
          "store": "FreshCo",
          "price": 1.77,
          "post_price_text": "/lb",
          "price_type": "per_lb",
          "...": "..."
        }
      ],
      "...": "..."
    }
  }
}
```

**Key points:**
- Adds `price_type` to every item: `"flat"`, `"per_lb"`, `"per_100g"`, or `"per_kg"`
- Ecom items are always `"flat"`
- `per_100g` prices are deceptive ($2.99/100g = ~$13.56/lb) — the LLM should flag these

---

## Step 3b: `select_walmart_baselines`

**Called by:** `find_deals_for_planning` internally
**Input:** `tagged_metrics` from Step 3
**Uses LLM:** Yes — picks the correct Walmart ecom product as baseline for each search term
**Output:**

```json
{
  "status": "success",
  "walmart_baselines": {
    "cheddar cheese": {
      "regular_price": 3.47,
      "reference": "Black Diamond Original Cheddar Cheese Slices",
      "reason": "standard cheddar slices"
    },
    "broccoli": {
      "regular_price": 2.44,
      "reference": "Broccoli Crowns",
      "reason": "basic fresh broccoli"
    },
    "pasta": {
      "regular_price": 2.44,
      "reference": "Barilla Pastina Pasta 340 G",
      "reason": "standard dry pasta"
    },
    "orange juice": {
      "regular_price": 6.98,
      "reference": "Our Finest orange juice",
      "reason": "standard orange juice"
    }
  }
}
```

**Key points:**
- LLM picks the most "normal" Walmart product for each item (avoids pet food, baby food, specialty items)
- `regular_price` = `original_price` if available, otherwise `current_price`
- Used in Step 4 to infer prices at stores that don't have a flyer deal

---

## Step 4: `build_store_comparison`

**Called by:** `find_deals_for_planning` internally
**Input:** `tagged_metrics` from Step 3 + `walmart_baselines` from Step 3b
**Uses LLM:** No — pure Python
**Output:**

```json
{
  "status": "success",
  "store_comparison": {
    "Super C": {
      "tier": "budget",
      "logo_url": "https://f.wishabi.net/merchants/3194/...",
      "deal_count": 2,
      "basket_total": 12.45,
      "items": {
        "cheddar cheese": {
          "price": 3.97,
          "source": "flyer",
          "name": "FROMAGE EXTRA CHEDDAR KRAFT | KRAFT EXTRA CHEDDAR CHEESE",
          "detail": "processed cheese slices",
          "price_type": "flat",
          "image_url": "https://f.wishabi.net/page_items/412495081/...",
          "sale_story": "3,32$ d'économie"
        },
        "broccoli": {
          "price": null,
          "estimated_price": 2.44,
          "source": "inferred",
          "note": "Walmart baseline $2.44 +0%"
        },
        "pasta": {
          "price": 1.69,
          "source": "flyer",
          "name": "pâtes alimentaires L'epi d'or | L'epi d'or pasta",
          "detail": "dry pasta",
          "price_type": "flat",
          "image_url": "https://f.wishabi.net/page_items/...",
          "sale_story": "30¢ d'économie"
        },
        "orange juice": {
          "price": null,
          "estimated_price": 6.98,
          "source": "inferred",
          "note": "Walmart baseline $6.98 +0%"
        }
      }
    },
    "FreshCo": {
      "tier": "budget",
      "deal_count": 3,
      "basket_total": 11.50,
      "items": {
        "cheddar cheese": {
          "price": 6.99,
          "source": "flyer",
          "name": "Balderson Cheddar Cheese",
          "price_type": "flat",
          "image_url": "https://..."
        },
        "broccoli": {
          "price": 1.77,
          "source": "flyer",
          "name": "Broccoli Crowns Product of USA or Mexico",
          "price_type": "per_lb",
          "image_url": "https://..."
        },
        "pasta": { "...": "..." },
        "orange juice": {
          "price": 2.99,
          "source": "flyer",
          "name": "Best Buy Orange Juice Blend 1.6 L",
          "price_type": "flat",
          "image_url": "https://..."
        }
      }
    },
    "Walmart": { "...": "..." },
    "Metro": { "...": "..." }
  },
  "walmart_baselines": { "...": "same as Step 3b output" },
  "store_tiers": {
    "budget": ["No Frills", "FreshCo", "Super C", "Maxi", "Food Basics", "Giant Tiger"],
    "mid": ["Walmart", "Real Canadian Superstore", "Costco"],
    "premium": ["Loblaws", "Metro", "Sobeys", "Farm Boy", "IGA", "..."]
  }
}
```

**Key points:**
- This is the main data structure the LLM reasons over
- Each store has every search term, with either a real deal or an inferred price
- `source` values: `"flyer"` (real deal), `"ecom"` (online price), `"inferred"` (estimated from Walmart baseline + tier markup), `"unknown"` (no data)
- `deal_count` = number of `source: "flyer"` items (real flyer deals only)
- Stores sorted by tier markup (budget first)

---

## Step 5: `find_nearby_stores` (geocoding)

**Called by:** `find_deals_for_planning` internally (after Step 4)
**Adds to Step 4 output:** `lat`, `lng`, `address` per store + `map_center`

```json
{
  "store_comparison": {
    "Super C": {
      "...": "...all Step 4 fields...",
      "lat": 45.4231,
      "lng": -75.6891,
      "address": "123 Main St, Ottawa, ON"
    }
  },
  "map_center": { "lat": 45.4215, "lng": -75.6972 },
  "removed_items": {
    "cheddar cheese": ["Goldfish Cheddar Crackers", "CHEF BOYARDEE Cheddar Blast"],
    "pasta": ["Cat food tuna pasta"]
  }
}
```

---

## `format_deals_overview` (formatting tool)

**Called by:** LLM agent (tool call #2)
**Input:** None (reads from `_last_pipeline_result` cache)
**Output:**

```json
{
  "status": "success",
  "formatted_markdown": "## All Available Deals\n\n<details>\n<summary>..."
}
```

**The `formatted_markdown` renders as:**

```markdown
## All Available Deals

<details>
<summary><strong>Cheddar Cheese</strong> — 10 deals, from $2.99</summary>

| Image | Store | Price | Product | Note |
|-------|-------|-------|---------|------|
| ![flyer](https://...) | Super C | $3.97 | FROMAGE EXTRA CHEDDAR KRAFT | 3,32$ d'économie |
| ![flyer](https://...) | FreshCo | $6.99 | Balderson Cheddar Cheese | Flyer |
| ![flyer](https://...) | Adonis | $6.99 | Armstrong marble cheddar | 42% OFF |
| ... | ... | ... | ... | ... |

</details>

<details>
<summary><strong>Broccoli</strong> — 8 deals, from $1.44</summary>

| Image | Store | Price | Product | Note |
|-------|-------|-------|---------|------|
| ![flyer](https://...) | Food Basics | $1.44 | BROCCOLI CROWNS | Flyer |
| ![flyer](https://...) | FreshCo | $1.77/lb | Broccoli Crowns Product of USA or Mexico | Flyer |
| ... | ... | ... | ... | ... |

</details>

...more items...
```

---

## `format_shopping_plan` (formatting tool)

**Called by:** LLM agent (tool call #3)
**Input:** LLM constructs `plan_items` from `store_comparison` data:

```json
{
  "plan_items": [
    {
      "search_term": "cheddar cheese",
      "store": "Super C",
      "price": "$3.97",
      "product": "FROMAGE EXTRA CHEDDAR KRAFT | KRAFT EXTRA CHEDDAR CHEESE"
    },
    {
      "search_term": "broccoli",
      "store": "FreshCo",
      "price": "$1.77/lb",
      "product": "Broccoli Crowns Product of USA or Mexico"
    },
    {
      "search_term": "pasta",
      "store": "Super C",
      "price": "$1.69",
      "product": "pâtes alimentaires L'epi d'or | L'epi d'or pasta"
    },
    {
      "search_term": "orange juice",
      "store": "FreshCo",
      "price": "$2.99",
      "product": "Best Buy Orange Juice Blend 1.6 L"
    }
  ],
  "reasoning": "Super C has the best deals on cheese and pasta, while FreshCo has great prices on broccoli and orange juice."
}
```

**Output:**

```json
{
  "status": "success",
  "formatted_markdown": "### Shopping Plan: FreshCo + Super C\n..."
}
```

**The `formatted_markdown` renders as:**

```markdown
### Shopping Plan: FreshCo + Super C
**Estimated total: ~$10.42** | 2 stores | 4 items

| Image | Item | Store | Price | Product |
|-------|------|-------|-------|---------|
| ![flyer](https://...) | Cheddar Cheese | Super C | $3.97 | FROMAGE EXTRA CHEDDAR KRAFT |
| ![flyer](https://...) | Broccoli | FreshCo | $1.77/lb | Broccoli Crowns Product of USA or Mexico |
| ![flyer](https://...) | Pasta | Super C | $1.69 | pâtes alimentaires L'epi d'or |
| ![flyer](https://...) | Orange Juice | FreshCo | $2.99 | Best Buy Orange Juice Blend 1.6 L |

---

**Why this combo:** Super C has the best deals on cheese and pasta, while FreshCo has great prices on broccoli and orange juice.
```

**Key points:**
- `search_term` + `store` are used to look up the `image_url` from the cached pipeline data
- `price` and `product` are passed directly by the LLM — it has full control over what appears
- Images are auto-enriched; the LLM never needs to pass URLs
