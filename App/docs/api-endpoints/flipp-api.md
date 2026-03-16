# Flipp API (backflipp.wishabi.com)

Flipp is a digital grocery flyer aggregator by Wishabi. The API powers the [Flipp consumer app](https://flipp.com) and returns weekly flyer deals and online prices from local grocery stores based on postal code.

**This is an undocumented/internal API** — there is no official public documentation.

## Endpoint

```
GET https://backflipp.wishabi.com/flipp/items/search
```

## Query Parameters

| Parameter     | Type   | Required | Example     | Description                        |
| ------------- | ------ | -------- | ----------- | ---------------------------------- |
| `q`           | string | Yes      | `chicken`   | Search query (item name)           |
| `postal_code` | string | Yes      | `K1A 0A6`   | Canadian postal code or US zip     |
| `locale`      | string | No       | `en-us`     | Locale for results language        |

## Response Structure

```json
{
  "items":          [],   // Weekly flyer deals (from printed/digital flyers)
  "ecom_items":     [],   // Online store deals (e-commerce listings)
  "ads":            [],   // Sponsored ads
  "coupons":        [],   // Coupon offers
  "coupons_v2":     [],   // Coupon offers (v2 format)
  "flyers":         [],   // Related flyer metadata
  "merchants":      [],   // Merchant metadata
  "native_ads":     [],   // Native ad placements
  "related_flyers": [],   // Related flyer suggestions
  "related_items":  [],   // Related item suggestions
  "facets":         {},   // Filter options (by store, by type)
  "sort":           {},   // Sort options
  "normalized_query": "", // Normalized search query
  "outside_fsa_flyers": {} // Flyers outside the postal area
}
```

## Item Types

### Flyer Item (`item_type: "flyer"`)

Weekly flyer deals from printed/digital store flyers. This is the primary data SAM uses.

```json
{
  "_L1": "Food, Beverages & Tobacco",
  "_L2": "Food Items",
  "clean_image_url": "https://f.wishabi.net/page_items/412067164/1772826755/extra_large.jpg",
  "clipping_image_url": "https://f.wishabi.net/page_items/412067164/1772826755/extra_large.jpg",
  "current_price": 5.96,
  "original_price": 10.97,
  "pre_price_text": null,
  "post_price_text": "lb",
  "sale_story": "Rollback",
  "name": "Janes Pub Style breaded chicken strips",
  "merchant_id": 234,
  "merchant_name": "Walmart",
  "merchant_logo": "https://images.wishabi.net/merchants/.../logo.jpg",
  "flyer_id": 7822508,
  "flyer_item_id": 998363817,
  "id": 998363817,
  "item_type": "flyer",
  "item_weight": 130.653,
  "brand_ids": ["11956"],
  "premium": true,
  "score": 312.4133,
  "valid_from": "2026-03-12T04:00:00+00:00",
  "valid_to": "2026-03-19T03:59:59+00:00",
  "left": 1722.5,
  "right": 1829.5,
  "top": -532.693,
  "bottom": -625.693,
  "indexed": false
}
```

| Field              | Type    | Description                                                      |
| ------------------ | ------- | ---------------------------------------------------------------- |
| `name`             | string  | Product name as shown on flyer                                   |
| `current_price`    | float   | Sale price                                                       |
| `original_price`   | float   | Regular price (null if not available)                             |
| `pre_price_text`   | string  | Text before price (e.g., "2 for")                                |
| `post_price_text`  | string  | Text after price (e.g., "lb", "/100g")                           |
| `sale_story`       | string  | Promotion type (e.g., "Rollback", "Buy 1 Get 1", "Weekly Deal") |
| `merchant_name`    | string  | Store name                                                       |
| `merchant_id`      | int     | Store ID                                                         |
| `merchant_logo`    | string  | Store logo URL                                                   |
| `valid_from`       | string  | Deal start date (ISO 8601)                                       |
| `valid_to`         | string  | Deal end date (ISO 8601)                                         |
| `clean_image_url`  | string  | Flyer clipping image URL                                         |
| `flyer_id`         | int     | Parent flyer ID                                                  |
| `flyer_item_id`    | int     | Unique item ID within the flyer                                  |
| `item_weight`      | float   | Internal relevance/display weight                                |
| `score`            | float   | Search relevance score                                           |
| `_L1` / `_L2`     | string  | Product category taxonomy                                        |
| `brand_ids`        | array   | Brand identifier(s)                                              |
| `premium`          | boolean | Whether this is a premium/promoted listing                       |
| `left/right/top/bottom` | float | Bounding box coordinates on the flyer page                  |

### E-commerce Item (`item_type: "ecom"`)

Online store listings with richer product data.

```json
{
  "name": "Maggi Chicken Cube",
  "current_price": 4.37,
  "original_price": 5.97,
  "description": "Bouillon Cubes, Powder & Concentrate Grocery",
  "merchant": "Walmart",
  "merchant_id": 234,
  "merchant_logo": "https://images.wishabi.net/merchants/.../logo.jpg",
  "image_url": "https://flipp-image-retrieval.flipp.com/api/...",
  "item_id": "2HR8KQAI9LTY",
  "item_type": "ecom",
  "sku": "2HR8KQAI9LTY",
  "global_id": "82ae841a-7abf-5a4d-8aff-caa8fd56717f",
  "global_id_int": 2942992053067090,
  "id": 0,
  "brand_ids": ["2226"],
  "average_rating": 4.476,
  "total_reviews": 0,
  "score": 189.4621,
  "display": "show",
  "return_info": { "details_url": "", "tag_line": "" },
  "shipping_info": { "details_url": "", "tag_line": "" },
  "shipping_tag_line": ""
}
```

| Field             | Type   | Description                              |
| ----------------- | ------ | ---------------------------------------- |
| `name`            | string | Product name                             |
| `description`     | string | Product description with category        |
| `current_price`   | float  | Current selling price                    |
| `original_price`  | float  | Original price before discount           |
| `merchant`        | string | Store name                               |
| `image_url`       | string | Product image (signed CloudFront URL)    |
| `sku`             | string | Store SKU                                |
| `average_rating`  | float  | Customer rating (null if none)           |
| `total_reviews`   | int    | Number of reviews                        |
| `return_info`     | object | Return policy info                       |
| `shipping_info`   | object | Shipping details                         |

## Facets (Filters)

The response includes available filters for narrowing results:

### Filter by Store

Returns all stores with matching results and their deal counts.

```json
{
  "key": "merchant",
  "title": "Filter by Store",
  "type": "checkbox_group",
  "data": {
    "values": [
      { "id": "all", "display": "Any Store", "count": 922 },
      { "id": 2018, "display": "Loblaws", "count": 9 },
      { "id": 234, "display": "Walmart", "count": 543 },
      { "id": 2269, "display": "Metro", "count": 30 }
    ]
  }
}
```

### Filter by Type

```json
{
  "key": "type",
  "title": "Filter by Type",
  "data": {
    "values": [
      { "id": "all", "display": "All Types", "count": 922 },
      { "id": "flyer_items", "display": "Weekly Ad Deals", "count": 254 },
      { "id": "online_items", "display": "Online Deals", "count": 668 },
      { "id": "coupons", "display": "Coupons", "count": 0 }
    ]
  }
}
```

### Sort Options

```json
{
  "key": "sort_type",
  "title": "Sort",
  "data": {
    "values": [
      { "id": "relevancy", "display": "Sort by Relevance" },
      { "id": "price_low_to_high", "display": "Price - Low to High" },
      { "id": "price_high_to_low", "display": "Price - High to Low" }
    ]
  }
}
```

## Stores Available (Ottawa K1A 0A6 example)

Adonis, Best Buy, Costco, Dollarama, Farm Boy, Food Basics, Foodland, FreshCo, Giant Tiger, Green Fresh Supermarket, Harvey's, Healthy Planet, IGA, La Boite a Grains, Loblaws, London Drugs, M&M Food Market, Maxi, Metro, Mid-East Food Centre, No Frills, Pet Valu, Pharmaprix, Provigo, Real Canadian Superstore, Rexall, Shoppers Drug Mart, Sobeys, Super C, T&T Supermarket, Walmart, Well.ca, Wholesale Club, Your Independent Grocer

## How SAM Uses This API

SAM calls this endpoint through three tool functions in `App/src/shopper_agent/grocery_tools.py`:

| Function                 | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `check_local_flyers()`   | Search deals for a single item                   |
| `find_best_deals_batch()`| Concurrent search across multiple items (max 10) |
| `find_deals_with_map()`  | Batch search + geocode stores for map display     |

The `_parse_flipp_items()` helper normalizes both `flyer` and `ecom` items into a unified deal format, extracts weight/size from text, and filters out non-grocery results (e.g., pet food).

## Example Response

Query: `GET https://backflipp.wishabi.com/flipp/items/search?q=chicken&postal_code=K1A+0A6&locale=en-us`

Response (trimmed to first 3 items per array):

```json
{
  "ads": [],
  "coupons": [],
  "coupons_v2": [],
  "ecom_items": [
    {
      "average_rating": 4.476200103759766,
      "brand_ids": [
        "2226"
      ],
      "current_price": 4.37,
      "description": "short description is not available Bouillon Cubes, Powder & Concentrate Grocery",
      "display": "show",
      "global_id": "82ae841a-7abf-5a4d-8aff-caa8fd56717f",
      "global_id_int": 2942992053067090,
      "id": 0,
      "image_url": "https://flipp-image-retrieval.flipp.com/api/...",
      "item_id": "2HR8KQAI9LTY",
      "item_type": "ecom",
      "merchant": "Walmart",
      "merchant_id": 234,
      "merchant_logo": "https://images.wishabi.net/merchants/0a2af35c-94b2-4950-9a80-d6e7c05bc5d2/RackMultipart20250714-1-k58tqh.jpg",
      "name": "Maggi Chicken Cube",
      "original_price": 5.97,
      "return_info": {
        "details_url": "",
        "tag_line": ""
      },
      "score": 194.56744,
      "shipping_info": {
        "details_url": "",
        "tag_line": ""
      },
      "shipping_tag_line": "",
      "sku": "2HR8KQAI9LTY",
      "total_reviews": 0
    },
    {
      "average_rating": 4.6128997802734375,
      "brand_ids": [
        "17332"
      ],
      "current_price": 2.57,
      "description": "Ready to eat, just add to any sandwich, and don't be afraid to use your imagination to fry or bake. Elite will always taste good. Sliced Chicken & Turkey Grocery",
      "display": "show",
      "global_id": "96583f91-0187-5d74-9813-831a3aba1abb",
      "global_id_int": 6338034693385374,
      "id": 0,
      "image_url": "https://flipp-image-retrieval.flipp.com/api/...",
      "item_id": "4ZA50ND1LRBQ",
      "item_type": "ecom",
      "merchant": "Walmart",
      "merchant_id": 234,
      "merchant_logo": "https://images.wishabi.net/merchants/0a2af35c-94b2-4950-9a80-d6e7c05bc5d2/RackMultipart20250714-1-k58tqh.jpg",
      "name": "Elite Halal Luncheon Chicken 340 G",
      "original_price": 2.97,
      "return_info": {
        "details_url": "",
        "tag_line": ""
      },
      "score": 200.28778,
      "shipping_info": {
        "details_url": "",
        "tag_line": ""
      },
      "shipping_tag_line": "",
      "sku": "4ZA50ND1LRBQ",
      "total_reviews": 0
    },
    {
      "average_rating": null,
      "brand_ids": [
        "12263"
      ],
      "current_price": 3.51,
      "description": "When baby is ready for more texture and protein from purees, this Black Bean, Sweet Corn, Chicken & Quinoa meal provides comforting tastes with just the right consistency. | Baby Gourmet Black Bean Sweet Corn Chicken & Quinoa Baby Food",
      "display": "show",
      "global_id": "12c9e7fc-8f40-5067-ac1e-acbdd7bdc126",
      "global_id_int": 1848026245046251,
      "id": 0,
      "image_url": "https://flipp-image-retrieval.flipp.com/api/...",
      "item_id": "104350",
      "item_type": "ecom",
      "merchant": "Well.ca",
      "merchant_id": 285,
      "merchant_logo": "https://images.wishabi.net/merchants/ReJaJ9AcCJO8nQ==/RackMultipart20190708-1-qwedpo.jpeg",
      "name": "Baby Gourmet Black Bean Sweet Corn Chicken & Quinoa Baby Food",
      "original_price": 4.39,
      "return_info": {
        "details_url": "",
        "tag_line": ""
      },
      "score": 202.32457,
      "shipping_info": {
        "details_url": "",
        "tag_line": ""
      },
      "shipping_tag_line": "",
      "sku": "104350",
      "total_reviews": 0
    }
  ],
  "facets": {
    "filters": [
      {
        "data": {
          "values": [
            { "id": "all", "display": "Any Store", "logo_url": "", "count": 922 },
            { "id": 3384, "display": "Adonis", "logo_url": "https://images.wishabi.net/merchants/...", "count": 17 },
            { "id": 2265, "display": "Food Basics", "logo_url": "https://images.wishabi.net/merchants/...", "count": 7 },
            { "id": 2018, "display": "Loblaws", "logo_url": "https://images.wishabi.net/merchants/...", "count": 9 },
            { "id": 2269, "display": "Metro", "logo_url": "https://images.wishabi.net/merchants/...", "count": 30 },
            { "id": 234, "display": "Walmart", "logo_url": "https://images.wishabi.net/merchants/...", "count": 543 }
          ]
        },
        "key": "merchant",
        "title": "Filter by Store",
        "type": "checkbox_group"
      },
      {
        "data": {
          "values": [
            { "id": "all", "display": "All Types", "count": 922 },
            { "id": "flyer_items", "display": "Weekly Ad Deals", "count": 254 },
            { "id": "online_items", "display": "Online Deals", "count": 668 },
            { "id": "coupons", "display": "Coupons", "count": 0 }
          ]
        },
        "key": "type",
        "title": "Filter by Type",
        "type": "checkbox_group"
      }
    ]
  },
  "flyers": [],
  "items": [
    {
      "_L1": "Food, Beverages & Tobacco",
      "_L2": "Food Items",
      "bottom": -625.693,
      "brand_ids": [
        "11956"
      ],
      "clean_image_url": "https://f.wishabi.net/page_items/412067164/1772826755/extra_large.jpg",
      "clipping_image_url": "https://f.wishabi.net/page_items/412067164/1772826755/extra_large.jpg",
      "current_price": 5.96,
      "flyer_id": 7822508,
      "flyer_item_id": 998363817,
      "id": 998363817,
      "indexed": false,
      "item_type": "flyer",
      "item_weight": 130.653,
      "left": 1722.5,
      "merchant_id": 234,
      "merchant_logo": "https://images.wishabi.net/merchants/0a2af35c-94b2-4950-9a80-d6e7c05bc5d2/RackMultipart20250714-1-k58tqh.jpg",
      "merchant_name": "Walmart",
      "name": "Janes Pub Style breaded chicken strips",
      "original_price": 10.97,
      "post_price_text": null,
      "pre_price_text": null,
      "premium": true,
      "right": 1829.5,
      "sale_story": "Rollback",
      "score": 314.51627,
      "top": -532.693,
      "valid_from": "2026-03-12T04:00:00+00:00",
      "valid_to": "2026-03-19T03:59:59+00:00"
    },
    {
      "_L1": "Food, Beverages & Tobacco",
      "_L2": "Food Items",
      "bottom": -562.839,
      "clean_image_url": "https://f.wishabi.net/page_items/412078169/1772832683/extra_large.jpg",
      "clipping_image_url": "https://f.wishabi.net/page_items/412078169/1772832683/extra_large.jpg",
      "current_price": 2.97,
      "flyer_id": 7822508,
      "flyer_item_id": 998373531,
      "id": 998373531,
      "indexed": false,
      "item_type": "flyer",
      "item_weight": 49.734,
      "left": 137.5,
      "merchant_id": 234,
      "merchant_logo": "https://images.wishabi.net/merchants/0a2af35c-94b2-4950-9a80-d6e7c05bc5d2/RackMultipart20250714-1-k58tqh.jpg",
      "merchant_name": "Walmart",
      "name": "Mina Halal drumsticks value pack",
      "original_price": 3.62,
      "post_price_text": "lb",
      "pre_price_text": null,
      "premium": true,
      "right": 226.5,
      "sale_story": "Rollback",
      "score": 269.06662,
      "top": -410.839,
      "valid_from": "2026-03-12T04:00:00+00:00",
      "valid_to": "2026-03-19T03:59:59+00:00"
    },
    {
      "_L1": "Food, Beverages & Tobacco",
      "_L2": "Food Items",
      "bottom": -574.839,
      "brand_ids": [
        "511"
      ],
      "clean_image_url": "https://f.wishabi.net/page_items/412078168/1772832682/extra_large.jpg",
      "clipping_image_url": "https://f.wishabi.net/page_items/412078168/1772832682/extra_large.jpg",
      "current_price": 2.97,
      "flyer_id": 7822508,
      "flyer_item_id": 998372323,
      "id": 998372323,
      "indexed": false,
      "item_type": "flyer",
      "item_weight": 28.269,
      "left": 37.5,
      "merchant_id": 234,
      "merchant_logo": "https://images.wishabi.net/merchants/0a2af35c-94b2-4950-9a80-d6e7c05bc5d2/RackMultipart20250714-1-k58tqh.jpg",
      "merchant_name": "Walmart",
      "name": "Maple Leaf drumsticks value pack",
      "original_price": 3.62,
      "post_price_text": "lb",
      "pre_price_text": null,
      "premium": true,
      "right": 126.5,
      "sale_story": "Rollback",
      "score": 254.66586,
      "top": -422.839,
      "valid_from": "2026-03-12T04:00:00+00:00",
      "valid_to": "2026-03-19T03:59:59+00:00"
    }
  ],
  "merchants": [],
  "native_ads": [],
  "normalized_query": "",
  "outside_fsa_flyers": {},
  "related_flyers": [],
  "related_items": [],
  "sort": {
    "filters": [
      {
        "data": {
          "values": [
            { "id": "relevancy", "display": "Sort by Relevance" },
            { "id": "price_low_to_high", "display": "Price - Low to High" },
            { "id": "price_high_to_low", "display": "Price - High to Low" }
          ]
        },
        "key": "sort_type",
        "title": "Sort",
        "type": "radio_group"
      }
    ]
  }
}
```

> **Note:** This response is trimmed for readability. The actual query returned **150 flyer items** (`items`) and **148 e-commerce items** (`ecom_items`) totaling **922 results** across all stores. Image URLs for `ecom_items` have been shortened (they contain signed CloudFront tokens). Response captured on 2026-03-14 for postal code K1A 0A6 (Ottawa, ON).