# Flipp API - Filtered Example Response

Query: `GET https://backflipp.wishabi.com/flipp/items/search?q=chicken&postal_code=K1A+0A6&locale=en-us&sort=relevancy&merchant=2018`

Parameters used:
- `q=chicken` - Search for chicken products
- `postal_code=K1A 0A6` - Ottawa, ON
- `locale=en-us` - English
- `sort=relevancy` - Sort by relevance score
- `merchant=2018` - Filter to Loblaws only (merchant ID 2018)

Response captured: 2026-03-14

## Results Summary

- **6 flyer items** (all from Loblaws weekly flyer)
- **0 ecom items** (Loblaws has no e-commerce listings in Flipp)
- **254 total flyer results** across all stores (shown in facets)

## Full Response

```json
{
  "ads": [],
  "coupons": [],
  "coupons_v2": [],
  "ecom_items": [],
  "facets": {
    "filters": [
      {
        "data": {
          "values": [
            { "id": "all", "display": "Any Store", "logo_url": "", "count": 254 },
            { "id": 3384, "display": "Adonis", "count": 17 },
            { "id": 2596, "display": "Costco", "count": 3 },
            { "id": 2711, "display": "Farm Boy", "count": 2 },
            { "id": 2265, "display": "Food Basics", "count": 7 },
            { "id": 3548, "display": "Foodland", "count": 7 },
            { "id": 2267, "display": "FreshCo", "count": 4 },
            { "id": 991, "display": "Giant Tiger", "count": 1 },
            { "id": 6770, "display": "Green Fresh Supermarket", "count": 7 },
            { "id": 4613, "display": "Harvey's", "count": 3 },
            { "id": 4592, "display": "IGA", "count": 15 },
            { "id": 2018, "display": "Loblaws", "count": 9 },
            { "id": 2024, "display": "M&M Food Market", "count": 28 },
            { "id": 2349, "display": "Maxi", "count": 15 },
            { "id": 2269, "display": "Metro", "count": 30 },
            { "id": 2332, "display": "No Frills", "count": 5 },
            { "id": 1995, "display": "Pet Valu", "count": 3 },
            { "id": 2271, "display": "Real Canadian Superstore", "count": 12 },
            { "id": 2072, "display": "Sobeys", "count": 12 },
            { "id": 2585, "display": "Super C", "count": 12 },
            { "id": 6373, "display": "T&T Supermarket", "count": 6 },
            { "id": 234, "display": "Walmart", "count": 19 },
            { "id": 2702, "display": "Wholesale Club", "count": 8 },
            { "id": 2337, "display": "Your Independent Grocer", "count": 5 }
          ]
        },
        "key": "merchant",
        "title": "Filter by Store",
        "type": "checkbox_group"
      },
      {
        "data": {
          "values": [
            { "id": "all", "display": "All Types", "count": 254 },
            { "id": "flyer_items", "display": "Weekly Ad Deals", "count": 254 },
            { "id": "online_items", "display": "Online Deals", "count": 0 },
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
      "bottom": -1104.81,
      "clean_image_url": "https://f.wishabi.net/page_items/412479905/1773013048/extra_large.jpg",
      "clipping_image_url": "https://f.wishabi.net/page_items/412479905/1773013048/extra_large.jpg",
      "current_price": 2.99,
      "flyer_id": 7826014,
      "flyer_item_id": 998943784,
      "id": 998943784,
      "indexed": false,
      "item_type": "flyer",
      "item_weight": 37.098,
      "left": 1608.07,
      "merchant_id": 2018,
      "merchant_logo": "http://images.wishabi.net/merchants/2018/1526504087/storefront_logo",
      "merchant_name": "Loblaws",
      "name": "CHICKEN DRUMSTICKS OR THIGHS",
      "original_price": null,
      "post_price_text": "lb",
      "pre_price_text": null,
      "premium": false,
      "right": 2335.35,
      "sale_story": "SAVE UP TO 45%",
      "score": 276.44748,
      "top": -303.102,
      "valid_from": "2026-03-12T04:00:00+00:00",
      "valid_to": "2026-03-19T03:59:59+00:00"
    },
    {
      "_L1": "Food, Beverages & Tobacco",
      "_L2": "Food Items",
      "bottom": -2847.04,
      "brand_ids": [
        "653"
      ],
      "clean_image_url": "https://f.wishabi.net/page_items/412446113/1773013058/extra_large.jpg",
      "clipping_image_url": "https://f.wishabi.net/page_items/412446113/1773013058/extra_large.jpg",
      "current_price": 15,
      "flyer_id": 7826014,
      "flyer_item_id": 998942720,
      "id": 998942720,
      "indexed": false,
      "item_type": "flyer",
      "item_weight": 7.047,
      "left": 5701.62,
      "merchant_id": 2018,
      "merchant_logo": "http://images.wishabi.net/merchants/2018/1526504087/storefront_logo",
      "merchant_name": "Loblaws",
      "name": "PC\u00ae WHOLE CHICKEN, UP TO 1.7 KG",
      "original_price": null,
      "post_price_text": null,
      "pre_price_text": null,
      "premium": false,
      "right": 6189.53,
      "sale_story": null,
      "score": 215.48827,
      "top": -2339.57,
      "valid_from": "2026-03-12T04:00:00+00:00",
      "valid_to": "2026-03-19T03:59:59+00:00"
    },
    {
      "_L1": "Food, Beverages & Tobacco",
      "_L2": "Food Items",
      "bottom": -3452.96,
      "clean_image_url": "https://f.wishabi.net/page_items/412479900/1773013061/extra_large.jpg",
      "clipping_image_url": "https://f.wishabi.net/page_items/412479900/1773013061/extra_large.jpg",
      "current_price": 16,
      "flyer_id": 7826014,
      "flyer_item_id": 998930613,
      "id": 998930613,
      "indexed": false,
      "item_type": "flyer",
      "item_weight": 0,
      "left": 7255.16,
      "merchant_id": 2018,
      "merchant_logo": "http://images.wishabi.net/merchants/2018/1526504087/storefront_logo",
      "merchant_name": "Loblaws",
      "name": "9 PIECE CHICKEN STRIPS, 700 G",
      "original_price": null,
      "post_price_text": null,
      "pre_price_text": null,
      "premium": false,
      "right": 7762.75,
      "sale_story": null,
      "score": 191.90863,
      "top": -2814.99,
      "valid_from": "2026-03-12T04:00:00+00:00",
      "valid_to": "2026-03-19T03:59:59+00:00"
    },
    {
      "_L1": "Food, Beverages & Tobacco",
      "_L2": "Food Items",
      "bottom": -1022.49,
      "brand_ids": [
        "23187"
      ],
      "clean_image_url": "https://f.wishabi.net/page_items/412446355/1773013052/extra_large.jpg",
      "clipping_image_url": "https://f.wishabi.net/page_items/412446355/1773013052/extra_large.jpg",
      "current_price": null,
      "flyer_id": 7826014,
      "flyer_item_id": 998944857,
      "id": 998944857,
      "indexed": false,
      "item_type": "flyer",
      "item_weight": 6.237,
      "left": 15793.3,
      "merchant_id": 2018,
      "merchant_logo": "http://images.wishabi.net/merchants/2018/1526504087/storefront_logo",
      "merchant_name": "Loblaws",
      "name": "SUFRA\u00ae HALAL CHICKEN DRUMSTICKS, UP TO 1.7 KG, THIGHS, UP TO 1.9 KG OR WHOLE CHICKEN, UP TO 1.8 KG",
      "original_price": null,
      "post_price_text": null,
      "pre_price_text": null,
      "premium": false,
      "right": 16329.3,
      "sale_story": "GET PC Optimum 5,000 for every $30* spent on sufra\u00ae halal chicken drumsticks, up to 1.7 kg, thighs, up to 1.9 kg or whole chicken, up to 1.8 kg $5 back in points",
      "score": 261.24716,
      "top": -459.423,
      "valid_from": "2026-03-12T04:00:00+00:00",
      "valid_to": "2026-03-19T03:59:59+00:00"
    },
    {
      "_L1": "Food, Beverages & Tobacco",
      "_L2": "Food Items",
      "bottom": -3385.19,
      "brand_ids": [
        "4538"
      ],
      "clean_image_url": "https://f.wishabi.net/page_items/412446114/1773013059/extra_large.jpg",
      "clipping_image_url": "https://f.wishabi.net/page_items/412446114/1773013059/extra_large.jpg",
      "current_price": 14,
      "flyer_id": 7826014,
      "flyer_item_id": 998930200,
      "id": 998930200,
      "indexed": false,
      "item_type": "flyer",
      "item_weight": 0.81,
      "left": 4713.84,
      "merchant_id": 2018,
      "merchant_logo": "http://images.wishabi.net/merchants/2018/1526504087/storefront_logo",
      "merchant_name": "Loblaws",
      "name": "MARCANGELO VALUE PACK PORK SAUSAGE, 1 KG",
      "original_price": null,
      "post_price_text": null,
      "pre_price_text": null,
      "premium": false,
      "right": 5202.46,
      "sale_story": null,
      "score": 103.95818,
      "top": -2859.2,
      "valid_from": "2026-03-12T04:00:00+00:00",
      "valid_to": "2026-03-19T03:59:59+00:00"
    },
    {
      "_L1": "Food, Beverages & Tobacco",
      "_L2": "Food Items",
      "bottom": -2472.78,
      "brand_ids": [
        "29772"
      ],
      "clean_image_url": "https://f.wishabi.net/page_items/412446362/1773013057/extra_large.jpg",
      "clipping_image_url": "https://f.wishabi.net/page_items/412446362/1773013057/extra_large.jpg",
      "current_price": 9,
      "flyer_id": 7826014,
      "flyer_item_id": 998943878,
      "id": 998943878,
      "indexed": false,
      "item_type": "flyer",
      "item_weight": 3.24,
      "left": 14856.8,
      "merchant_id": 2018,
      "merchant_logo": "http://images.wishabi.net/merchants/2018/1526504087/storefront_logo",
      "merchant_name": "Loblaws",
      "name": "KEBAB FACTORY TANDOORI CHICKEN BURGERS, 678 G",
      "original_price": null,
      "post_price_text": null,
      "pre_price_text": null,
      "premium": false,
      "right": 15347.5,
      "sale_story": null,
      "score": 221.73338,
      "top": -1983.74,
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

## Observations

1. **Filtering by merchant removes ecom items entirely** - only flyer items are returned when a store filter is applied
2. **Facet counts update** - the "Any Store" count drops from 922 (unfiltered) to 254 (flyer-only), since filtering also excludes ecom results from the total
3. **Fuzzy matching** - result #5 is "MARCANGELO VALUE PACK PORK SAUSAGE" which has no chicken in the name (relevance score 103.9 vs 276.4 for the top result). This is why SAM's `_is_relevant_deal()` filter in `grocery_tools.py` checks for query word overlap
4. **Null prices** - some items have `current_price: null` (e.g., the Sufra halal chicken). These are typically loyalty-reward-only deals where the "price" is points-based, described in `sale_story`
5. **Sort parameter** - `sort=relevancy` is the default; the response items are ordered by descending `score`
6. **Store filter parameter** - uses `merchant={id}` (not `merchant_id`), where the ID comes from the facets response
