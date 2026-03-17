import logging
import re
from typing import Any, Dict, List, Optional

from ._playwright_base import headless_page

log = logging.getLogger(__name__)

_SEARCH_URL = "https://voila.ca/search"
_STORE_NAME = "Voila (Sobeys)"

_JS_EXTRACT = r"""
() => {
    var cards = document.querySelectorAll('.product-card-container');
    var results = [];
    for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var text = c.innerText;
        var lines = text.split('\n').filter(function(l) { return l.trim(); });
        var imgEl = c.querySelector('img');
        var linkEl = c.querySelector('a[href*="/products/"]');
        results.push({
            rawText: lines.join(' | ').substring(0, 500),
            imageUrl: imgEl ? (imgEl.getAttribute('src') || '') : '',
            link: linkEl ? linkEl.href : '',
        });
    }
    return results;
}
"""

# Matches "($19.29 per kilogram)" or "($24.89 per kilogram)"
_PER_KG_RE = re.compile(r"\(\$(\d+\.?\d*)\s*per\s*kilogram\)", re.IGNORECASE)
# Matches "($15.00 per item)"
_PER_ITEM_RE = re.compile(r"\(\$(\d+\.?\d*)\s*per\s*item\)", re.IGNORECASE)
# Matches "Price | $8.68" or "Price $13.33"
_PRICE_RE = re.compile(r"Price\s*\|?\s*\$(\d+\.?\d*)")
# Matches "0.45kg" or "0.575kg"
_WEIGHT_RE = re.compile(r"(\d+\.?\d*)\s*kg", re.IGNORECASE)
# Matches "15% OFF" or "20% OFF"
_DEAL_RE = re.compile(r"(\d+%\s*OFF)", re.IGNORECASE)


def _parse_voila_product(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Convert raw Voila card text into a clean dict."""
    text = raw.get("rawText", "")

    # Extract product name — first meaningful segment after filtering badges
    name = ""
    for segment in text.split(" | "):
        seg = segment.strip()
        if seg and seg not in (
            "Sponsored", "This is a featured product",
            "Gluten Free", "Halal", "Shop Canada",
        ) and "Product Life" not in seg and "product life" not in seg:
            name = seg
            break

    per_kg = _PER_KG_RE.search(text)
    per_item = _PER_ITEM_RE.search(text)
    price_match = _PRICE_RE.search(text)
    weight_match = _WEIGHT_RE.search(text)
    deal_match = _DEAL_RE.search(text)

    price_per_kg = float(per_kg.group(1)) if per_kg else None
    price = None
    display_price = None

    if price_match:
        price = price_match.group(1)
        display_price = f"${price}"
    elif per_item:
        price = per_item.group(1)
        display_price = f"${price}"

    weight = f"{weight_match.group(1)}kg" if weight_match else None

    return {
        "product_id": "",
        "brand": "",
        "title": name,
        "name": name,
        "description": "",
        "price": price,
        "display_price": display_price,
        "was_price": None,
        "price_per_kg": price_per_kg,
        "price_per_lb": round(price_per_kg / 2.20462, 2) if price_per_kg else None,
        "is_avg_price": weight is not None,
        "package_sizing": weight or "",
        "category": "",
        "weighted": weight is not None,
        "deal": deal_match.group(1) if deal_match else None,
        "image_url": raw.get("imageUrl", ""),
        "link": raw.get("link", ""),
    }


async def get_voila_prices(
    query: str,
    max_results: int = 50,
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Fetch live shelf prices from Voila (Sobeys online) using headless Playwright.

    Voila is Sobeys' online grocery platform (powered by Ocado).

    Args:
        query: Search term (e.g. "chicken breast", "coffee").
        max_results: Maximum number of products to return.
        tool_context: Agent tool context (unused, kept for consistency).
        tool_config: Optional config dict.

    Returns:
        Dict with status, store, products list, query, and result count.
    """
    log_id = f"[LivePricing:{_STORE_NAME}]"
    log.info(f"{log_id} Searching for: {query}")

    try:
        async with headless_page(timeout=30000) as page:
            await page.goto(
                f"{_SEARCH_URL}?q={query}",
                wait_until="domcontentloaded",
            )
            await page.wait_for_timeout(8000)

            raw_products: List[Dict[str, Any]] = await page.evaluate(_JS_EXTRACT)

        if not raw_products:
            return {
                "status": "not_found",
                "store": _STORE_NAME,
                "message": f"No products found for '{query}' on {_STORE_NAME}.",
                "query": query,
            }

        products = [_parse_voila_product(p) for p in raw_products[:max_results]]

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
