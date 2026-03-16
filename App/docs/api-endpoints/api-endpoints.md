# SAM API Endpoints Reference

Last reviewed: 2026-03-14

This document covers all REST API endpoints exposed by the FastAPI server (`src/inventory_api/app.py`),
the external APIs they consume, and the agent-based API layer used by the frontend chat system.

---

## Table of Contents

1. [REST API Endpoints](#1-rest-api-endpoints)
   - [Health Check](#11-health-check)
   - [Inventory](#12-inventory)
   - [Receipt Scanning](#13-receipt-scanning)
   - [Flyer Deals](#14-flyer-deals)
   - [Shopping List](#15-shopping-list)
2. [External APIs](#2-external-apis)
   - [Flipp (Flyer Search)](#21-flipp-flyer-search)
   - [OpenStreetMap Overpass (Store Locations)](#22-openstreetmap-overpass-store-locations)
   - [Nominatim (Geocoding)](#23-nominatim-geocoding)
   - [Spoonacular (Recipes)](#24-spoonacular-recipes)
   - [Open Food Facts (Product Lookup)](#25-open-food-facts-product-lookup)
   - [UPCitemdb (Barcode Lookup)](#26-upcitemdb-barcode-lookup)
3. [Agent-Based API Layer](#3-agent-based-api-layer)
4. [Database Schema](#4-database-schema)
5. [Internal Python Tool Functions](#5-internal-python-tool-functions)

---

## 1. REST API Endpoints

Base URL: `http://localhost:8001` (configurable via `VITE_INVENTORY_API_URL`)

### 1.1 Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "inventory-rest-api"
}
```

---

### 1.2 Inventory

#### List Inventory Items

```
GET /api/inventory/items?limit=200
```

| Param   | Type | Default | Range   | Description              |
|---------|------|---------|---------|--------------------------|
| `limit` | int  | 200     | 1 - 500 | Max items to return      |

**Response:**
```json
{
  "status": "success",
  "count": 12,
  "rows": [
    {
      "id": 1,
      "product_name": "Chicken Breast Boneless",
      "quantity": 2.0,
      "quantity_unit": "lb",
      "unit": "pack",
      "category": "Meat",
      "created_at": "2026-03-10T14:30:00",
      "updated_at": "2026-03-12T09:15:00"
    }
  ]
}
```

#### Insert Inventory Items

```
POST /api/inventory/items
Content-Type: application/json
```

**Request body:**
```json
{
  "items": [
    {
      "product_name": "Milk",
      "quantity": 2,
      "quantity_unit": "L",
      "unit": "carton",
      "category": "Dairy"
    }
  ]
}
```

| Field           | Type         | Required | Description                                          |
|-----------------|------------- |----------|------------------------------------------------------|
| `product_name`  | string       | Yes      | Product name                                         |
| `quantity`      | float        | No       | Amount (default: 1)                                  |
| `quantity_unit` | string\|null | No       | Unit of measurement (g, kg, lb, oz, mL, L, unit)     |
| `unit`          | string\|null | No       | Packaging type (can, bottle, bag, box, jar, loaf...) |
| `category`      | string\|null | No       | Must be a valid category (see Database Schema)       |

**Response:**
```json
{
  "status": "success",
  "inserted": 1,
  "increased": 0,
  "skipped": 0,
  "processed": 1,
  "skipped_details": []
}
```

If a product with the same name and unit already exists, its quantity is increased rather than duplicated.

---

### 1.3 Receipt Scanning

```
POST /api/receipt/scan
Content-Type: multipart/form-data
```

| Param  | Type | Description                          |
|--------|------|--------------------------------------|
| `file` | File | Receipt image (PNG, JPG, WebP)       |

Uses a vision LLM to extract grocery items from a receipt photo, then enriches items via PLU/UPC code lookup.

**Response:**
```json
{
  "status": "success",
  "count": 5,
  "enriched": 2,
  "items": [
    {
      "product_name": "Banana",
      "quantity": 1.2,
      "quantity_unit": "kg",
      "unit": "bunch",
      "category": "Produce",
      "is_food": true,
      "product_code": "4011",
      "price": 1.47
    }
  ]
}
```

**Enrichment sources:**
- PLU codes (4-5 digit produce codes) - built-in lookup table with 80+ entries
- Open Food Facts API (`https://world.openfoodfacts.org/api/v2/product/{upc}.json`)
- UPCitemdb API (`https://api.upcitemdb.com/prod/trial/lookup?upc={code}`)

---

### 1.4 Flyer Deals

```
GET /api/flyer/deals?postal_code=K1A+0A6&locale=en-us&lat=45.4215&lng=-75.6972
```

| Param         | Type   | Default  | Description                          |
|---------------|--------|----------|--------------------------------------|
| `postal_code` | string | K1A 0A6  | Canadian postal code for flyer area  |
| `locale`      | string | en-us    | Locale (`en-us`, `fr-ca`)            |
| `lat`         | float  | 45.4215  | Latitude for nearby store lookup     |
| `lng`         | float  | -75.6972 | Longitude for nearby store lookup    |

Fetches all inventory items, searches the Flipp API for flyer deals on each item, then resolves nearby store locations via OpenStreetMap Overpass.

**Response:**
```json
{
  "status": "success",
  "summary": {
    "Bread": {
      "found": true,
      "options": [
        {
          "store": "Walmart",
          "item": "Great Value sliced bread",
          "price": "$2.48",
          "original_price": "$3.00",
          "pre_price_text": "",
          "post_price_text": "LB",
          "sale_story": "SAVE UP TO 38%",
          "valid_from": "2026-03-12T04:00:00+00:00",
          "valid_to": "2026-03-18T03:59:59+00:00",
          "image_url": "https://f.wishabi.net/page_items/.../extra_large.jpg",
          "item_type": "flyer"
        }
      ]
    },
    "Pasta": {
      "found": false,
      "note": "No relevant flyer deals found for 'Pasta'."
    }
  },
  "inventory": {
    "Bread": { "quantity": 1, "quantity_unit": "loaf", "unit": "" },
    "Pasta": { "quantity": 2, "quantity_unit": "box", "unit": "" }
  },
  "store_locations": {
    "Walmart": [
      {
        "name": "Walmart Supercentre",
        "lat": 45.3456,
        "lng": -75.7890,
        "address": "1234 Main St, Ottawa"
      }
    ]
  },
  "item_count": 52,
  "location_used": "Ottawa, Ontario, Canada",
  "postal_code": "K1A 0A6"
}
```

---

### 1.5 Shopping List

#### List Shopping List Items

```
GET /api/shopping-list/items?limit=200
```

| Param   | Type | Default | Range   | Description         |
|---------|------|---------|---------|---------------------|
| `limit` | int  | 200     | 1 - 500 | Max items to return |

**Response:**
```json
{
  "status": "success",
  "count": 3,
  "rows": [
    {
      "id": 1,
      "product_name": "Eggs",
      "quantity": 1.0,
      "quantity_unit": "dozen",
      "unit": null,
      "category": "Dairy",
      "checked": 0,
      "created_at": "2026-03-12T10:00:00",
      "updated_at": "2026-03-12T10:00:00"
    }
  ]
}
```

#### Add Shopping List Items

```
POST /api/shopping-list/items
Content-Type: application/json
```

**Request body:** Same schema as inventory insert.

**Response:**
```json
{
  "status": "success",
  "inserted": 2,
  "increased": 0,
  "skipped": 0,
  "processed": 2
}
```

#### Toggle Shopping List Item (Check/Uncheck)

```
PATCH /api/shopping-list/items/{item_id}/toggle
```

**Response:**
```json
{
  "status": "success",
  "id": 1,
  "checked": 1
}
```

#### Delete Shopping List Item

```
DELETE /api/shopping-list/items/{item_id}
```

**Response:**
```json
{
  "status": "success",
  "deleted": 1,
  "id": 1
}
```

#### Clear All Checked Items

```
DELETE /api/shopping-list/checked
```

**Response:**
```json
{
  "status": "success",
  "deleted": 4
}
```

---

## 2. External APIs

### 2.1 Flipp (Flyer Search)

**Base URL:** `https://backflipp.wishabi.com/flipp/items/search`
**Auth:** None (public API)

#### Query Parameters

| Param         | Type   | Required | Description                                         |
|---------------|--------|----------|-----------------------------------------------------|
| `q`           | string | Yes      | Search query (e.g., "chicken breast")                |
| `postal_code` | string | Yes      | Postal/zip code for local flyers                     |
| `locale`      | string | No       | Locale code (`en-us`, `fr-ca`)                       |
| `sort`        | string | No       | `relevancy`, `price_low_to_high`, `price_high_to_low`|
| `merchant_id` | int    | No       | Filter by specific merchant ID                       |
| `limit`       | int    | No       | Max number of items to return                        |

#### Response Structure (Top-Level Keys)

| Key                  | Type   | Description                                         |
|----------------------|--------|-----------------------------------------------------|
| `items`              | array  | Combined flyer + ecom items (main results)           |
| `ecom_items`         | array  | E-commerce items only (separate listing)             |
| `flyers`             | array  | Related flyer metadata                               |
| `merchants`          | array  | Related merchant metadata                            |
| `facets`             | object | Filter facets (store list with counts)               |
| `sort`               | object | Available sort options                               |
| `ads`                | array  | Sponsored ads                                        |
| `coupons`            | array  | Related coupons                                      |
| `coupons_v2`         | array  | V2 coupon format                                     |
| `native_ads`         | array  | Native ad placements                                 |
| `normalized_query`   | string | Normalized version of search query                   |
| `outside_fsa_flyers` | array  | Flyers outside the Forward Sortation Area            |
| `related_flyers`     | array  | Related flyer suggestions                            |
| `related_items`      | array  | Related item suggestions                             |

#### Flyer Item Fields (`item_type: "flyer"`)

| Field              | Type         | Description                                             | Currently Used |
|--------------------|--------------|---------------------------------------------------------|----------------|
| `name`             | string\|null | Product name from flyer                                 | Yes            |
| `current_price`    | float\|null  | Sale price                                              | Yes            |
| `original_price`   | float\|null  | Regular price before sale                               | Yes            |
| `pre_price_text`   | string\|null | Text before price (e.g., "2/")                          | Yes            |
| `post_price_text`  | string\|null | Text after price (e.g., "lb", "/100g", "LB")           | Yes            |
| `sale_story`       | string\|null | Sale badge text (e.g., "SAVE UP TO 38%", "18% OFF")    | Yes            |
| `valid_from`       | string       | Deal start date (ISO 8601)                              | Yes            |
| `valid_to`         | string       | Deal end date (ISO 8601)                                | Yes            |
| `clean_image_url`  | string       | Clean product image URL                                 | Yes            |
| `clipping_image_url`| string      | Flyer clipping image URL                                | Yes            |
| `image_url`        | string       | Fallback image URL (ecom items)                         | Yes (fallback) |
| `merchant_name`    | string       | Store name (flyer items)                                | Yes            |
| `merchant_id`      | int          | Flipp merchant ID                                       | No             |
| `merchant_logo`    | string       | Store logo URL                                          | No             |
| `item_type`        | string       | `"flyer"` or `"ecom"`                                   | Yes            |
| `item_weight`      | float        | Relevance/display weight (NOT product weight)           | No             |
| `score`            | float        | Search relevance score                                  | No             |
| `flyer_id`         | int          | ID of the source flyer                                  | No             |
| `flyer_item_id`    | int          | Unique item ID within the flyer                         | No             |
| `id`               | int          | Same as `flyer_item_id` for flyer items                 | No             |
| `brand_ids`        | array        | Associated brand IDs                                    | No             |
| `_L1`              | string       | Top-level product category (e.g., "Food, Beverages & Tobacco") | No      |
| `_L2`              | string       | Sub-category (e.g., "Food Items")                       | No             |
| `premium`          | bool         | Whether this is a premium/promoted listing              | No             |
| `indexed`          | bool         | Whether the item content has been indexed/OCR'd         | No             |
| `top`              | float        | Flyer page coordinates (top)                            | No             |
| `bottom`           | float        | Flyer page coordinates (bottom)                         | No             |
| `left`             | float        | Flyer page coordinates (left)                           | No             |
| `right`            | float        | Flyer page coordinates (right)                          | No             |

#### E-commerce Item Fields (`item_type: "ecom"`)

| Field              | Type         | Description                                     | Currently Used |
|--------------------|--------------|-------------------------------------------------|----------------|
| `name`             | string       | Product name                                    | Yes            |
| `description`      | string       | Full product description (often includes weight/size) | No       |
| `current_price`    | float        | Current price                                   | Yes            |
| `original_price`   | float\|null  | Original price (if on sale)                     | Yes            |
| `merchant`         | string       | Store name (ecom items use this instead of `merchant_name`) | Yes |
| `merchant_id`      | int          | Flipp merchant ID                               | No             |
| `merchant_logo`    | string       | Store logo URL                                  | No             |
| `item_type`        | string       | Always `"ecom"`                                 | Yes            |
| `item_id`          | string       | Product ID / SKU                                | No             |
| `sku`              | string       | Product SKU (often same as `item_id`)           | No             |
| `global_id`        | string       | UUID for the product                            | No             |
| `global_id_int`    | int          | Integer version of global ID                    | No             |
| `score`            | float        | Search relevance score                          | No             |
| `average_rating`   | float\|null  | Customer rating (e.g., 4.5)                     | No             |
| `total_reviews`    | int          | Number of reviews                               | No             |
| `brand_ids`        | array        | Associated brand IDs                            | No             |
| `image_url`        | string       | Product image URL (signed, with transforms)     | Yes            |
| `display`          | string       | Display flag (e.g., "show")                     | No             |
| `return_info`      | object       | `{ details_url, tag_line }`                     | No             |
| `shipping_info`    | object       | `{ details_url, tag_line }`                     | No             |
| `shipping_tag_line`| string       | Shipping description                            | No             |

#### Facets Response (Store Filtering)

The `facets` key returns available store filters with item counts:
```json
{
  "filters": [
    {
      "key": "merchant_id",
      "title": "Store",
      "type": "radio_group",
      "data": {
        "values": [
          { "id": "all", "display": "Any Store", "logo_url": "", "count": 106 },
          { "id": 234, "display": "Walmart", "logo_url": "https://...", "count": 12 },
          { "id": 2271, "display": "Real Canadian Superstore", "logo_url": "https://...", "count": 5 }
        ]
      }
    }
  ]
}
```

#### Sort Options

Available via the `sort` response key:
- `relevancy` (default)
- `price_low_to_high`
- `price_high_to_low`

#### Untapped Capabilities

These Flipp response fields are returned but **not currently used** by SAM:

| Field / Section     | Potential Use                                                  |
|---------------------|----------------------------------------------------------------|
| `merchant_logo`     | Show store logos next to deal cards                             |
| `_L1`, `_L2`        | Auto-categorize deals (Food vs Non-Food, sub-categories)       |
| `brand_ids`         | Brand-based filtering or grouping                              |
| `description` (ecom)| Extract weight/size info, show product details                 |
| `average_rating`    | Show customer ratings on ecom items                            |
| `original_price`    | Show crossed-out original price for savings display            |
| `flyer_id`          | Link back to the full flyer page                               |
| `facets`            | Build a store filter dropdown in the UI                        |
| `sort` parameter    | Let users sort deals by price                                  |
| `limit` parameter   | Control result count per query                                 |
| `score`             | Sort by relevance confidence                                   |
| `ecom_items`        | Show online ordering options alongside flyer deals             |

---

### 2.2 OpenStreetMap Overpass (Store Locations)

**Base URL:** `https://overpass-api.de/api/interpreter`
**Auth:** None (public API)
**Used by:** `grocery_tools.find_nearby_stores()`

Queries for retail stores matching brand names within a radius of a center point.

**Query format (Overpass QL):**
```
[out:json][timeout:10];
nwr["brand"~"Walmart|Metro|Loblaws",i]["shop"](around:30000,45.4215,-75.6972);
out center 50;
```

**Parameters used:**
- Brand regex matching (case-insensitive)
- Radius: 30km default
- Max results: 50 per query
- Tags extracted: `addr:housenumber`, `addr:street`, `addr:city`, `brand`, `name`

**Response used:**
```json
{
  "name": "Walmart Supercentre",
  "lat": 45.3456,
  "lng": -75.7890,
  "address": "1234 Main St, Ottawa"
}
```

**Caching:** In-memory cache keyed by `store_names + coordinates` to avoid redundant lookups.

---

### 2.3 Nominatim (Geocoding)

**Base URL:** `https://nominatim.openstreetmap.org/search`
**Auth:** None (public, rate-limited to 1 req/sec)
**Used by:** `route_optimizer._geocode_store()`

Geocodes store names to coordinates for route planning, using a viewbox bounded ~30km around the center point.

**Parameters:**
- `q`: Store name
- `format`: json
- `limit`: 1
- `viewbox`: Bounding box around center
- `bounded`: 1

---

### 2.4 Spoonacular (Recipes)

**Base URL:** `https://api.spoonacular.com`
**Auth:** API key via `SPOONACULAR_API_KEY` env var
**Used by:** `recipe_agent/mealdb_tools.py`

See [spoonacular-api-capabilities.md](./spoonacular-api-capabilities.md) for the full feature catalog.

**Endpoints used by SAM:**

| Endpoint                            | SAM Function             | Purpose                           |
|-------------------------------------|--------------------------|-----------------------------------|
| `recipes/complexSearch`             | `complex_search`         | Advanced recipe search with filters |
| `recipes/findByIngredients`         | `get_top_3_meals`        | Find recipes by available ingredients |
| `recipes/{id}/information`          | `get_meal_details`       | Full recipe details                |
| `recipes/{id}/information` (bulk)   | `get_meal_details_bulk`  | Multiple recipe details            |
| `recipes/random`                    | `get_random_meal`        | Random recipe suggestion           |
| `recipes/parseIngredients`          | `parse_ingredients`      | Structuralize ingredient text      |
| `food/ingredients/substitutes`      | `get_substitutes`        | Find ingredient substitutes        |
| `recipes/convert`                   | `convert_amounts`        | Unit conversion                    |

---

### 2.5 Open Food Facts (Product Lookup)

**Base URL:** `https://world.openfoodfacts.org/api/v2/product/{upc}.json`
**Auth:** None (public API)
**Used by:** `receipt_scanner_tools.enrich_product_codes()`

Looks up products by UPC barcode to enrich receipt scan results with accurate product names.

---

### 2.6 UPCitemdb (Barcode Lookup)

**Base URL:** `https://api.upcitemdb.com/prod/trial/lookup?upc={code}`
**Auth:** None (trial tier)
**Used by:** `receipt_scanner_tools.enrich_product_codes()`

Fallback barcode lookup when Open Food Facts has no match.

---

## 3. Agent-Based API Layer

The frontend chat system communicates with SAM agents via a gateway client (`web/src/api/agents.js`).
Prompts are sent as natural language and responses are parsed from JSON, markdown tables, or plain text.

### Available Agents

| Agent Name             | Role                                         | Tools Available                                    |
|------------------------|----------------------------------------------|----------------------------------------------------|
| `OrchestratorAgent`    | Routes requests to appropriate agents        | (orchestration only)                               |
| `InventoryOrchestrator`| Inventory & shopping list management         | `artifact_management` (built-in)                   |
| `ShopperAgent`         | Flyer deal search                            | `check_local_flyers`, `find_best_deals_batch`, `find_deals_with_map` |
| `RoutePlannerAgent`    | Shopping route optimization                  | `plan_optimal_route`                               |
| `RecipeAssistant`      | Recipe request routing                       | (routing only)                                     |
| `RecipeInventorySearch`| Recipes from current pantry                  | `get_ingredient_names`, `complex_search`, `get_top_3_meals`, `search_meals`, `get_meal_details_bulk`, `get_meal_details` |
| `RecipeGeneralSearch`  | General recipe search                        | `complex_search`, `get_top_3_meals`, `search_meals`, `get_meal_details_bulk`, `get_meal_details`, `get_random_meal`, `parse_ingredients`, `convert_amounts`, `get_substitutes` |

### Agent API Functions (Frontend)

```javascript
// Inventory
api.inventory.list()
api.inventory.addItems("2 kg rice, 1 liter milk")
api.inventory.increaseStock(name, amount, quantityUnit, unit)
api.inventory.decreaseStock(name, amount, quantityUnit, unit)
api.inventory.deleteItem(name, quantityUnit, unit)
api.inventory.prompt("free-form request")

// Recipes
api.recipes.searchByIngredients(["rice", "chicken"])
api.recipes.getDetails("Chicken Tikka Masala")
api.recipes.getRandom()
api.recipes.suggestFromInventory()
api.recipes.prompt("free-form request")

// Shopper
api.shopper.findDeals("chicken", "Ottawa")
api.shopper.findDealsBatch(["eggs", "milk"], "Ottawa")
api.shopper.shoppingPlan(["eggs", "flour"], "Ottawa")
api.shopper.prompt("free-form request")

// Orchestrator (auto-routes)
api.orchestrator.prompt("any question")
```

---

## 4. Database Schema

SQLite database (default: `inventory.db`)

### inventory table

```sql
CREATE TABLE IF NOT EXISTS inventory (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_name  TEXT NOT NULL,
  quantity       REAL DEFAULT 0,
  quantity_unit  TEXT,
  unit           TEXT,
  created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at     TEXT DEFAULT CURRENT_TIMESTAMP,
  category       TEXT DEFAULT 'Other'
);
```

### shopping_list table

```sql
CREATE TABLE IF NOT EXISTS shopping_list (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_name  TEXT NOT NULL,
  quantity       REAL DEFAULT 1,
  quantity_unit  TEXT,
  unit           TEXT,
  category       TEXT DEFAULT 'Other',
  checked        INTEGER DEFAULT 0,
  created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at     TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Valid Categories

```
Produce, Dairy, Meat, Seafood, Grains, Beverages,
Snacks, Condiments, Frozen, Baking, Canned, Other
```

---

## 5. Internal Python Tool Functions

These functions are called by agents and/or the REST API. They are not directly exposed as HTTP endpoints.

### Inventory Tools (`src/inventory_agent/inventory_manager_tools.py`)

| Function                           | Description                              |
|------------------------------------|------------------------------------------|
| `list_inventory_items`             | Query all inventory rows                 |
| `insert_inventory_items`           | Add items (or increase existing qty)     |
| `increase_inventory_stock`         | Increase quantity of a specific item     |
| `decrease_inventory_stock`         | Decrease quantity of a specific item     |
| `delete_inventory_item`            | Delete a single item by name + unit      |
| `bulk_delete_inventory_items`      | Delete multiple items at once            |
| `get_ingredient_names`             | Get comma-separated list of all names    |
| `list_shopping_list_items`         | Query all shopping list rows             |
| `insert_shopping_list_items`       | Add items to shopping list               |
| `toggle_shopping_list_item`        | Toggle checked/unchecked by ID           |
| `delete_shopping_list_item`        | Delete shopping list item by ID          |
| `clear_checked_shopping_list_items`| Remove all checked items                 |

### Receipt Tools (`src/receipt_agent/receipt_scanner_tools.py`)

| Function                        | Description                                     |
|---------------------------------|-------------------------------------------------|
| `scan_receipt_image_from_bytes` | Vision LLM extracts items from receipt image     |
| `enrich_product_codes`          | PLU/UPC lookup to improve product names          |

### Shopper Tools (`src/shopper_agent/grocery_tools.py`)

| Function                | Description                                          |
|-------------------------|------------------------------------------------------|
| `check_local_flyers`    | Search Flipp for deals on a single item              |
| `find_best_deals_batch` | Search Flipp for deals on multiple items             |
| `find_deals_with_map`   | Batch search + store geocoding for map display       |
| `find_nearby_stores`    | Query Overpass for store locations by brand name      |

### Route Optimizer (`src/shopper_agent/route_optimizer.py`)

| Function               | Description                                                  |
|------------------------|--------------------------------------------------------------|
| `plan_optimal_route`   | Multi-store route optimization with weighted scoring          |

Scoring weights (configurable):
- `weight_price`: 0.35 (cheapest deals)
- `weight_convenience`: 0.25 (fewer stops)
- `weight_coverage`: 0.25 (most items found)
- `weight_distance`: 0.15 (shortest travel)

### Recipe Tools (`src/recipe_agent/mealdb_tools.py`)

| Function               | Description                                      |
|------------------------|--------------------------------------------------|
| `complex_search`       | Advanced search with filters (diet, cuisine, etc)|
| `get_top_3_meals`      | Best recipes by ingredient match                 |
| `search_meals`         | Basic search by ingredient/category/area         |
| `get_meal_details_bulk`| Fetch multiple recipe details by IDs             |
| `get_meal_details`     | Fetch single recipe detail                       |
| `get_random_meal`      | Random recipe suggestion                         |
| `parse_ingredients`    | Parse free-text ingredient list into structured data |
| `convert_amounts`      | Convert between measurement units                |
| `get_substitutes`      | Find ingredient substitutes                      |
