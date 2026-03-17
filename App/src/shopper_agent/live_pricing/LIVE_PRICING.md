# Live Pricing Tools — Summary

Last updated: 2026-03-16

## Overview

The `live_pricing/` module provides real-time shelf price lookups from 11 Canadian grocery stores. It uses two scraping methods depending on the store's website architecture:

- **SSR (Server-Side Rendering)** — Extracts product data from the `__NEXT_DATA__` JSON blob embedded in HTML by Next.js. Fast (~1-2s per query), no browser needed.
- **Playwright (Headless Browser)** — Launches headless Chromium to render JavaScript-dependent pages and extract product data from the DOM. Slower (~8-10s per query), requires `playwright` + Chromium installed.

---

## Directory Structure

```
live_pricing/
├── __init__.py
│
├── ssr/                          # SSR scraping (fast, ~1-2s per query)
│   ├── __init__.py
│   ├── _pcx_base.py              # Shared Loblaw PCX Next.js parsing logic
│   ├── loblaws.py                # get_loblaws_prices
│   ├── superstore.py             # get_superstore_prices
│   ├── nofrills.py               # get_nofrills_prices
│   ├── independent_grocer.py     # get_independent_grocer_prices
│   ├── provigo.py                # get_provigo_prices
│   └── maxi.py                   # get_maxi_prices
│
└── playwright/                   # Headless browser (slower, ~8-10s per query)
    ├── __init__.py
    ├── _playwright_base.py        # Shared Playwright browser management
    ├── metro.py                   # get_metro_prices
    ├── food_basics.py             # get_food_basics_prices
    ├── super_c.py                 # get_super_c_prices
    ├── giant_tiger.py             # get_giant_tiger_prices
    └── voila.py                   # get_voila_prices
```

---

## Store Coverage

| # | Store | Parent Company | Market Share | Region | Method | Speed |
|---|-------|---------------|-------------|--------|--------|-------|
| 1 | Loblaws | Loblaw Companies | ~30% (combined) | National | SSR | ~1-2s |
| 2 | Real Canadian Superstore | Loblaw Companies | | West + ON | SSR | ~1-2s |
| 3 | No Frills | Loblaw Companies | | National | SSR | ~1-2s |
| 4 | Your Independent Grocer | Loblaw Companies | | National | SSR | ~1-2s |
| 5 | Provigo | Loblaw Companies | | Quebec | SSR | ~1-2s |
| 6 | Maxi | Loblaw Companies | | Quebec | SSR | ~1-2s |
| 7 | Metro | Metro Inc. | ~12% (combined) | ON + QC | Playwright | ~8-10s |
| 8 | Food Basics | Metro Inc. | | Ontario | Playwright | ~8-10s |
| 9 | Super C | Metro Inc. | | Quebec | Playwright | ~8-10s |
| 10 | Giant Tiger | Independent | ~2% | National | Playwright | ~8-10s |
| 11 | Voila (Sobeys online) | Empire / Sobeys | ~25% | ON + QC | Playwright | ~8-10s |

**Additional coverage via the existing Flipp API** (flyer deals + ecom prices, already integrated in `grocery_tools.py`):

- Walmart Canada (ecom shelf prices + flyer deals)
- Safeway (flyer deals)
- FreshCo (flyer deals)
- Farm Boy (flyer deals)
- IGA (flyer deals)
- And 20+ other chains

---

## How Each Method Works

### SSR (Loblaw PCX Stores)

All 6 Loblaw-owned stores run on the same **PCX Next.js platform**. When a search page is requested, the server pre-renders the HTML and embeds all product data in a `<script id="__NEXT_DATA__">` JSON blob.

```
Agent                               Loblaws Server (Next.js)
  |                                        |
  |  GET /en/search?search-bar=chicken     |
  |--------------------------------------->|
  |                                        |  1. Server calls internal product API
  |                                        |  2. Embeds product JSON in HTML as __NEXT_DATA__
  |   Full HTML with embedded JSON         |
  |<---------------------------------------|
  |                                        |
  |  Parse __NEXT_DATA__ -> extract products
```

**Key findings:**
- Loblaws uses **national online pricing** — prices are identical across all stores in all provinces (verified across Ottawa ON, Markham ON, Pickering ON, Vancouver BC, Edmonton AB).
- No store ID or location parameter is needed.
- Pagination supported via `?page=2` param (~48 products per page, up to ~288 max).
- Each store banner has **different pricing and promotions** despite being owned by the same company.

### Playwright (Metro, Food Basics, Super C, Giant Tiger, Voila)

These stores don't embed product data in SSR HTML — they require JavaScript to render the DOM. We use headless Chromium via Playwright to:

1. Navigate to the search URL
2. Wait for JS to render product tiles (~5-8s)
3. Extract product data from DOM elements via `page.evaluate()`

**Platform groupings:**
- Metro, Food Basics, Super C — same Metro Inc. platform, use `[data-product-code]` tile elements
- Giant Tiger — Shopify store, uses `.product-tile` elements with `.price__value` and `.price__unit`
- Voila (Sobeys) — Ocado-powered, uses `.product-card-container` elements

---

## Return Data Schema

### Fields by Method

| Field | SSR (6 stores) | Playwright (5 stores) | Notes |
|-------|:-:|:-:|-------|
| `product_id` | Yes | Partial | Metro/Food Basics/Super C have product codes |
| `article_number` | Yes | No | Loblaw internal article number |
| `brand` | Yes | No | Text brand name |
| `title` | Yes | Yes | Product title |
| `name` | Yes | Yes | Brand + title (SSR) or title (Playwright) |
| `description` | Yes (HTML) | No | Full product description |
| `price` | Yes (raw string) | Yes (raw string) | Raw numeric price |
| `display_price` | Yes | Yes | Formatted with `$` sign |
| `was_price` | Yes | No | Previous price if on sale |
| `member_only_price` | Yes | No | PC Optimum member price |
| `package_sizing` | Yes | Partial | e.g. "1.1 kg, $1.91/100g" |
| `uom` | Yes | No | Unit of measure: EA, KG |
| `pricing_unit` | Yes | No | e.g. "ea" |
| `pricing_unit_type` | Yes | No | e.g. "SOLD_BY_EACH", "SOLD_BY_EACH_PRICED_BY_WEIGHT" |
| `min_order_quantity` | Yes | No | |
| `max_order_quantity` | Yes | No | |
| `weighted` | Yes | Yes | Whether product is sold by weight |
| `price_per_kg` | No | Yes | Parsed from DOM pricing text |
| `price_per_lb` | No | Yes | Parsed from DOM pricing text |
| `is_avg_price` | No | Yes | Whether price is an average estimate |
| `category` | No | Partial | Metro/Food Basics/Super C have categories |
| `deal` | Yes | Partial | Voila has deal text; SSR has deal text |
| `promotions` | Yes (array) | No | e.g. `[{"text": "PC Optimum Points", "type": "DEAL"}]` |
| `average_rating` | Yes | No | Customer rating (float) |
| `review_count` | Yes | No | Number of reviews |
| `image_url` | Yes | Yes | Product image URL |
| `image_url_large` | Yes | No | Large product image URL |
| `link` | Yes | Yes | Product page URL/path |
| `badge` | Yes | No | e.g. "Prepared in Canada" badge object |

### Response Envelope

All stores return the same top-level structure:

```json
{
  "status": "success" | "not_found" | "error",
  "store": "Loblaws",
  "query": "chicken breast",
  "result_count": 50,
  "products": [ ... ],
  "message": "..." // only on error/not_found
}
```

---

## Stores NOT Covered (and Why)

| Store | Region | Issue | Workaround |
|-------|--------|-------|------------|
| Walmart Canada | National | PerimeterX bot detection blocks headless Playwright; headed mode works but impractical for servers | Covered by Flipp API (ecom prices + flyer deals) |
| Costco | National | Membership-walled, no public pricing | Out of scope — different shopping model |
| Save-On-Foods | BC, AB, SK, MB | Not tested | Could be worth investigating |
| Safeway | Western Canada | Sobeys-owned, no online grocery search | Covered by Flipp flyer deals |
| FreshCo | ON, Western | No online product search on website | Covered by Flipp flyer deals |
| IGA | Quebec | Empire-owned, not tested | Could be worth investigating |
| Farm Boy | Ontario | Website has no pricing data | Covered by Flipp flyer deals |
| T&T Supermarket | Urban centers | Fully client-side rendered, no data in headless | Not currently viable |
| Sobeys (corporate site) | National | Corporate site only — not an online grocery store | Use Voila instead |

---

## Usage Examples

### SSR Store

```python
from src.shopper_agent.live_pricing.ssr.loblaws import get_loblaws_prices

result = await get_loblaws_prices("chicken breast", max_results=50)
# result["products"][0]["display_price"] -> "$13.00"
# result["products"][0]["package_sizing"] -> "1 ea, $13.00/1ea"
# result["products"][0]["description"]    -> "<p>Raised in Canada..."
```

### Playwright Store

```python
from src.shopper_agent.live_pricing.playwright.metro import get_metro_prices

result = await get_metro_prices("chicken breast", max_results=50)
# result["products"][0]["display_price"] -> "$11.00/kg"
# result["products"][0]["price_per_kg"]  -> 11.0
# result["products"][0]["price_per_lb"]  -> 4.99
```

### All function signatures

All functions share the same signature for consistency:

```python
async def get_<store>_prices(
    query: str,
    max_results: int = 50,
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]
```

---

## Dependencies

- `httpx` — HTTP client for SSR scraping (already in project)
- `playwright` — Headless browser automation (already installed)
- Chromium browser — Install via `playwright install chromium`

---

## Key Technical Notes

1. **Loblaw national pricing** — All Loblaw PCX stores use the same price nationwide. Verified across ON, BC, AB. The `store_id` / `pc-express-book` param only affects product availability and sort order, not price. However, each banner (Loblaws vs No Frills vs Superstore) has different pricing.

2. **Metro platform stores** (Metro, Food Basics, Super C) share identical DOM structure with `[data-product-code]` tiles containing `data-product-name`, `data-product-category`, `data-is-weighted`, and pricing text in `.pricing` elements.

3. **Playwright stores are slower** because they launch a real browser per query. Consider caching results or batching queries.

4. **Bot detection** — Walmart and Shoppers Drug Mart use PerimeterX/Akamai which blocks even headless Playwright. All other stores work reliably in headless mode.

5. **Flipp API complements live pricing** — The existing `grocery_tools.py` Flipp integration (`https://backflipp.wishabi.com/flipp/items/search`) covers flyer/sale prices across all major chains with no auth required. It also provides Walmart ecom shelf prices (without unit pricing). The live pricing tools add regular shelf prices that Flipp doesn't cover.
