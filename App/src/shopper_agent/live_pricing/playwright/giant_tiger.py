import logging
import re
from typing import Any, Dict, List, Optional

from ._playwright_base import headless_page

log = logging.getLogger(__name__)

_SEARCH_URL = "https://www.gianttiger.com/search"
_STORE_NAME = "Giant Tiger"

_JS_EXTRACT = """
() => {
    var tiles = document.querySelectorAll('.product-tile');
    var results = [];
    for (var i = 0; i < tiles.length; i++) {
        var t = tiles[i];
        var titleEl = t.querySelector('.product-tile__title');
        var priceEl = t.querySelector('.price__value');
        var unitPriceEl = t.querySelector('.price__unit');
        var linkEl = t.querySelector('a');
        var imgEl = t.querySelector('img');
        results.push({
            name: titleEl ? titleEl.innerText.trim() : '',
            priceText: priceEl ? priceEl.innerText.trim() : '',
            unitPriceText: unitPriceEl ? unitPriceEl.innerText.trim() : '',
            link: linkEl ? linkEl.href : '',
            imageUrl: (() => {
                if (!imgEl) return '';
                var srcset = imgEl.getAttribute('data-srcset') || imgEl.getAttribute('srcset') || '';
                if (srcset) {
                    var firstUrl = srcset.split(',')[0].trim().split(' ')[0];
                    return firstUrl.startsWith('//') ? 'https:' + firstUrl : firstUrl;
                }
                var src = imgEl.getAttribute('src') || '';
                return src.startsWith('//') ? 'https:' + src : src;
            })(),
        });
    }
    return results;
}
"""

_PRICE_RE = re.compile(r"\$(\d+\.?\d*)")
_UNIT_PRICE_RE = re.compile(r"\$(\d+\.?\d*)\s*/\s*(100g|kg|lb)", re.IGNORECASE)


def _parse_giant_tiger_product(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a raw Giant Tiger DOM product into a clean dict."""
    price_match = _PRICE_RE.search(raw.get("priceText", ""))
    price = price_match.group(1) if price_match else None
    display_price = f"${price}" if price else None

    unit_match = _UNIT_PRICE_RE.search(raw.get("unitPriceText", ""))
    price_per_kg = None
    if unit_match:
        up_val = float(unit_match.group(1))
        up_unit = unit_match.group(2).lower()
        if up_unit == "100g":
            price_per_kg = round(up_val * 10, 2)
        elif up_unit == "kg":
            price_per_kg = up_val

    return {
        "product_id": "",
        "brand": "",
        "title": raw.get("name", ""),
        "name": raw.get("name", ""),
        "description": "",
        "price": price,
        "display_price": display_price,
        "was_price": None,
        "price_per_kg": price_per_kg,
        "price_per_lb": round(price_per_kg / 2.20462, 2) if price_per_kg else None,
        "is_avg_price": False,
        "package_sizing": raw.get("unitPriceText", ""),
        "category": "",
        "weighted": False,
        "deal": None,
        "image_url": raw.get("imageUrl", ""),
        "link": raw.get("link", ""),
    }


async def get_giant_tiger_prices(
    query: str,
    max_results: int = 50,
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Fetch live shelf prices from Giant Tiger using headless Playwright.

    Giant Tiger runs on Shopify with simple product-tile DOM elements.

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
        async with headless_page(timeout=25000) as page:
            await page.goto(
                f"{_SEARCH_URL}?q={query}",
                wait_until="domcontentloaded",
            )
            await page.wait_for_timeout(5000)

            raw_products: List[Dict[str, Any]] = await page.evaluate(_JS_EXTRACT)

        if not raw_products:
            return {
                "status": "not_found",
                "store": _STORE_NAME,
                "message": f"No products found for '{query}' on {_STORE_NAME}.",
                "query": query,
            }

        products = [_parse_giant_tiger_product(p) for p in raw_products[:max_results]]

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
