"""Shared logic for Loblaw PCX platform stores.

Loblaws, Real Canadian Superstore, No Frills, Your Independent Grocer,
and Shoppers Drug Mart all run on the same Next.js PCX platform with
identical __NEXT_DATA__ structures. This module provides the common
fetch/parse logic so each store tool only needs to configure its URL.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional

import httpx

log = logging.getLogger(__name__)

_PRODUCTS_PER_PAGE = 48
_MAX_PAGES = 6

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

_NEXT_DATA_RE = re.compile(
    r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
    re.DOTALL,
)


def _extract_products_from_next_data(raw_json: str) -> List[Dict[str, Any]]:
    """Recursively find all product objects with pricing in the __NEXT_DATA__ JSON."""
    data = json.loads(raw_json)
    products: List[Dict[str, Any]] = []

    def _find(obj: Any, depth: int = 0) -> None:
        if depth > 15:
            return
        if isinstance(obj, dict):
            if "productId" in obj and "pricing" in obj:
                products.append(obj)
            for v in obj.values():
                _find(v, depth + 1)
        elif isinstance(obj, list):
            for item in obj:
                _find(item, depth + 1)

    _find(data)
    return products


def parse_pcx_product(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a raw PCX product object into a clean dict."""
    pricing = raw.get("pricing", {})
    deal = raw.get("deal")
    pricing_units = raw.get("pricingUnits", {})
    ratings = raw.get("ratings") or {}
    promotions = raw.get("promotions") or []
    images = raw.get("productImage") or [{}]

    return {
        "product_id": raw.get("productId", ""),
        "article_number": raw.get("articleNumber", ""),
        "brand": raw.get("brand", ""),
        "title": raw.get("title", ""),
        "name": f"{raw.get('brand') or ''} {raw.get('title', '')}".strip(),
        "description": raw.get("description", ""),
        "price": pricing.get("price"),
        "display_price": pricing.get("displayPrice"),
        "was_price": pricing.get("wasPrice"),
        "member_only_price": pricing.get("memberOnlyPrice"),
        "package_sizing": raw.get("packageSizing", ""),
        "uom": raw.get("uom", ""),
        "pricing_unit": pricing_units.get("unit"),
        "pricing_unit_type": pricing_units.get("type"),
        "min_order_quantity": pricing_units.get("minOrderQuantity"),
        "max_order_quantity": pricing_units.get("maxOrderQuantity"),
        "weighted": pricing_units.get("weighted", False),
        "deal": deal.get("text") if deal else None,
        "promotions": [
            {"text": p.get("text", ""), "type": p.get("type", "")}
            for p in promotions if p.get("text")
        ],
        "average_rating": ratings.get("averageRating"),
        "review_count": ratings.get("reviewCount"),
        "image_url": images[0].get("mediumUrl", ""),
        "image_url_large": images[0].get("largeUrl", ""),
        "link": raw.get("link", ""),
        "badge": raw.get("textBadge") or raw.get("productBadge") or None,
    }


async def _fetch_pcx_page(
    client: httpx.AsyncClient,
    search_url: str,
    query: str,
    page: int,
) -> List[Dict[str, Any]]:
    """Fetch a single page of PCX search results and return raw product objects."""
    params: Dict[str, str] = {"search-bar": query}
    if page > 1:
        params["page"] = str(page)

    resp = await client.get(
        search_url,
        params=params,
        headers={"User-Agent": _USER_AGENT},
    )
    resp.raise_for_status()

    match = _NEXT_DATA_RE.search(resp.text)
    if not match:
        return []
    return _extract_products_from_next_data(match.group(1))


async def fetch_pcx_prices(
    search_url: str,
    store_name: str,
    query: str,
    max_results: int = 50,
) -> Dict[str, Any]:
    """Fetch live shelf prices from a Loblaw PCX platform store.

    All Loblaw PCX stores use national online pricing — prices are the
    same across all locations, so no store ID is needed.

    Args:
        search_url: The store's search page URL.
        store_name: Display name for logging and responses.
        query: Search term (e.g. "chicken breast", "coffee").
        max_results: Maximum number of products to return. Defaults to 50
                     (single page). Set higher to fetch additional pages
                     (~48 products per page, up to ~288 max).

    Returns:
        Dict with status, store, products list, query, and result count.
    """
    log_id = f"[LivePricing:{store_name}]"
    log.info(f"{log_id} Searching for: {query} (max_results={max_results})")

    pages_needed = min(
        (max_results + _PRODUCTS_PER_PAGE - 1) // _PRODUCTS_PER_PAGE, _MAX_PAGES
    )

    try:
        seen_ids: set[str] = set()
        all_products: List[Dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            for page in range(1, pages_needed + 1):
                raw_products = await _fetch_pcx_page(client, search_url, query, page)
                if not raw_products:
                    break

                new_count = 0
                for raw in raw_products:
                    pid = raw.get("productId", "")
                    if pid in seen_ids:
                        continue
                    seen_ids.add(pid)
                    all_products.append(parse_pcx_product(raw))
                    new_count += 1

                    if len(all_products) >= max_results:
                        break

                if new_count == 0 or len(all_products) >= max_results:
                    break

        if not all_products:
            return {
                "status": "not_found",
                "message": f"No products found for '{query}' on {store_name}.",
                "store": store_name,
                "query": query,
            }

        log.info(f"{log_id} Found {len(all_products)} products for '{query}'")
        return {
            "status": "success",
            "store": store_name,
            "query": query,
            "result_count": len(all_products),
            "products": all_products,
        }

    except httpx.HTTPStatusError as e:
        log.error(f"{log_id} HTTP error: {e}", exc_info=True)
        return {
            "status": "error",
            "store": store_name,
            "message": f"{store_name} returned HTTP {e.response.status_code}",
        }
    except Exception as e:
        log.error(f"{log_id} Failed: {e}", exc_info=True)
        return {"status": "error", "store": store_name, "message": str(e)}
