import logging
from typing import Any, Dict, Optional

from .metro import _JS_EXTRACT, _parse_metro_product

from ._playwright_base import headless_page

log = logging.getLogger(__name__)

_SEARCH_URL = "https://www.superc.ca/en/search"
_PRODUCT_URL = "https://www.superc.ca/en/product/{product_id}"
_STORE_NAME = "Super C"


async def get_super_c_prices(
    query: str,
    max_results: int = 50,
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Fetch live shelf prices from Super C (Quebec) using headless Playwright.

    Super C uses the same Metro Inc. platform, so the DOM structure
    and parsing logic are shared with the Metro tool.

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
                f"{_SEARCH_URL}?filter={query}",
                wait_until="domcontentloaded",
            )
            await page.wait_for_timeout(5000)

            raw_products = await page.evaluate(_JS_EXTRACT)

        if not raw_products:
            return {
                "status": "not_found",
                "store": _STORE_NAME,
                "message": f"No products found for '{query}' on {_STORE_NAME}.",
                "query": query,
            }

        products = [_parse_metro_product(p, _PRODUCT_URL) for p in raw_products[:max_results]]

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
