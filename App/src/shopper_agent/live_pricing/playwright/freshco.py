"""FreshCo live pricing via headless Playwright + Algolia API intercept.

FreshCo (Sobeys/Empire) uses Algolia for product search. Product data is
NOT in the SSR HTML — it's fetched client-side via Algolia's search API.
We intercept the Algolia response in-flight to extract structured product data.
"""

import logging
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus

from ._playwright_base import headless_page

log = logging.getLogger(__name__)

_STORE_NAME = "FreshCo"
_SEARCH_URL = "https://www.freshco.com/?query={query}&tab=products"
_ALGOLIA_PRODUCT_INDEX = "dxp_product_en"

_NON_FOOD_CATEGORIES = {
    "Pets", "Baby",
    "Pharmacy & Wellness", "Personal Care & Beauty",
    "Kitchen & Household", "Household Products",
    "Floral & Garden", "Toys, Games & Party Supplies",
}


def _parse_promotion(promo: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Extract sale price and description from a FreshCo/Algolia promotion."""
    rewards = promo.get("promotionReward", [])
    for reward in rewards:
        if reward.get("rewardShortDesc") == "Customer Price":
            values = reward.get("value1Value20", [{}])
            sale_price = values[0].get("value_1") if values else None
            if sale_price:
                try:
                    return {
                        "sale_price": float(sale_price),
                        "description": promo.get("promotionDescription") or "Sale",
                        "source": promo.get("source", ""),
                    }
                except (ValueError, TypeError):
                    pass
    return None


def _parse_freshco_product(hit: Dict[str, Any]) -> Dict[str, Any]:
    """Convert an Algolia hit into the standard product dict."""
    name = hit.get("name", "")
    brand = hit.get("brand", "")
    price = hit.get("price")
    uom = hit.get("uom", "EA")
    size = hit.get("size") or ""
    description = hit.get("description") or ""
    categories = hit.get("hierarchicalCategories", {})
    category = (categories.get("lvl0") or [""])[0] if categories else ""
    images = hit.get("images") or []
    image_url = images[0] if images else ""

    # Build display price
    display_price = None
    if price is not None:
        if uom == "KG":
            display_price = f"${price:.2f}/kg"
        else:
            display_price = f"${price:.2f}"

    # Parse promotions for sale prices
    was_price = None
    deal = None
    promotions = hit.get("promotions") or []
    for promo in promotions:
        parsed = _parse_promotion(promo)
        if parsed:
            was_price = display_price
            sale_price = parsed["sale_price"]
            if uom == "KG":
                display_price = f"${sale_price:.2f}/kg"
            else:
                display_price = f"${sale_price:.2f}"
            deal = parsed["description"]
            break

    # Package sizing
    package_sizing = size
    if not package_sizing and uom == "KG" and price is not None:
        package_sizing = f"${price:.2f}/kg"

    return {
        "product_id": hit.get("objectID", ""),
        "brand": brand,
        "title": name,
        "name": f"{brand} {name}".strip() if brand else name,
        "description": description[:200] if description else "",
        "price": display_price,
        "display_price": display_price,
        "was_price": was_price,
        "price_per_kg": price if uom == "KG" else None,
        "is_avg_price": False,
        "package_sizing": package_sizing,
        "uom": uom,
        "category": category,
        "weighted": uom == "KG",
        "deal": deal,
        "image_url": image_url,
        "link": f"https://www.freshco.com/product/{hit.get('pageSlug', '')}" if hit.get("pageSlug") else "",
    }


async def get_freshco_prices(
    query: str,
    max_results: int = 50,
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Fetch live shelf prices from FreshCo using headless Playwright.

    Navigates to FreshCo's search page and intercepts the Algolia API
    response to extract structured product data.

    Args:
        query: Search term (e.g. "chicken breast", "salmon").
        max_results: Maximum number of products to return.
        tool_context: Agent tool context (unused, kept for consistency).
        tool_config: Optional config dict.

    Returns:
        Dict with status, store, products list, query, and result count.
    """
    log_id = f"[LivePricing:{_STORE_NAME}]"
    log.info(f"{log_id} Searching for: {query}")

    captured_products: List[Dict[str, Any]] = []

    try:
        async with headless_page(timeout=30000) as page:
            # Set up route intercept for Algolia product search
            async def handle_algolia(route):
                try:
                    response = await route.fetch()
                    body = await response.json()
                    for result in body.get("results", []):
                        if result.get("index") == _ALGOLIA_PRODUCT_INDEX:
                            captured_products.extend(result.get("hits", []))
                    await route.fulfill(response=response)
                except Exception as e:
                    log.warning(f"{log_id} Route intercept error: {e}")
                    await route.continue_()

            await page.route(
                lambda url: "algolia.net" in str(url) and "queries" in str(url),
                handle_algolia,
            )

            url = _SEARCH_URL.format(query=quote_plus(query))
            await page.goto(url, wait_until="domcontentloaded")
            await page.wait_for_timeout(6000)

        if not captured_products:
            log.info(f"{log_id} No products found for '{query}'")
            return {
                "status": "not_found",
                "store": _STORE_NAME,
                "message": f"No products found for '{query}' on {_STORE_NAME}.",
                "query": query,
            }

        # Filter out non-food products (pet food, pharmacy, household, etc.)
        food_hits = [
            hit for hit in captured_products
            if not _NON_FOOD_CATEGORIES.intersection(
                hit.get("hierarchicalCategories", {}).get("lvl0", [])
            )
        ]

        products = [
            _parse_freshco_product(hit)
            for hit in food_hits[:max_results]
        ]

        log.info(f"{log_id} Found {len(products)} products for '{query}'")
        return {
            "status": "success",
            "store": _STORE_NAME,
            "query": query,
            "result_count": len(products),
            "products": products,
        }

    except Exception as e:
        log.error(f"{log_id} Failed: {e}", exc_info=True)
        return {"status": "error", "store": _STORE_NAME, "message": str(e)}
