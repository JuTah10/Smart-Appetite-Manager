"""SAM tool entry point for live grocery price lookups.

Routes search requests to the correct store-specific scraper
(SSR for Loblaw PCX stores, Playwright for Metro/Food Basics/etc).
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional

log = logging.getLogger(__name__)

# Store name -> (module path, function name)
_STORE_REGISTRY: Dict[str, tuple] = {
    # SSR stores (Loblaw PCX platform)
    "loblaws": ("shopper_agent.live_pricing.ssr.loblaws", "get_loblaws_prices"),
    "real canadian superstore": ("shopper_agent.live_pricing.ssr.superstore", "get_superstore_prices"),
    "superstore": ("shopper_agent.live_pricing.ssr.superstore", "get_superstore_prices"),
    "no frills": ("shopper_agent.live_pricing.ssr.nofrills", "get_nofrills_prices"),
    "nofrills": ("shopper_agent.live_pricing.ssr.nofrills", "get_nofrills_prices"),
    "your independent grocer": ("shopper_agent.live_pricing.ssr.independent_grocer", "get_independent_grocer_prices"),
    "independent grocer": ("shopper_agent.live_pricing.ssr.independent_grocer", "get_independent_grocer_prices"),
    "provigo": ("shopper_agent.live_pricing.ssr.provigo", "get_provigo_prices"),
    "maxi": ("shopper_agent.live_pricing.ssr.maxi", "get_maxi_prices"),
    
    # Playwright stores (headless browser)
    "metro": ("shopper_agent.live_pricing.playwright.metro", "get_metro_prices"),
    "food basics": ("shopper_agent.live_pricing.playwright.food_basics", "get_food_basics_prices"),
    "super c": ("shopper_agent.live_pricing.playwright.super_c", "get_super_c_prices"),
    "giant tiger": ("shopper_agent.live_pricing.playwright.giant_tiger", "get_giant_tiger_prices"),
    "voila": ("shopper_agent.live_pricing.playwright.voila", "get_voila_prices"),
    "freshco": ("shopper_agent.live_pricing.playwright.freshco", "get_freshco_prices"),
}

_SUPPORTED_STORES = [
    "Loblaws", "Real Canadian Superstore", "No Frills",
    "Your Independent Grocer", "Provigo", "Maxi",
    "Metro", "Food Basics", "Super C", "Giant Tiger", "Voila", "FreshCo",
]


def _resolve_store(store_name: str):
    """Look up the store scraper function by name. Returns the async function or None."""
    key = store_name.strip().lower()
    entry = _STORE_REGISTRY.get(key)
    if not entry:
        return None

    import importlib
    module = importlib.import_module(entry[0])
    return getattr(module, entry[1])


_SLIM_FIELDS = {
    "name", "brand", "display_price", "was_price",
    "package_sizing", "uom", "deal", "member_only_price",
    "image_url",
}


def _slim_product(p: Dict[str, Any]) -> Dict[str, Any]:
    """Keep only the fields needed for price comparison reasoning."""
    return {k: v for k, v in p.items() if k in _SLIM_FIELDS and v}


def _slim_item_result(r: Dict[str, Any]) -> Dict[str, Any]:
    """Strip a single item result down to essential fields."""
    slimmed = {
        "status": r.get("status"),
        "query": r.get("query"),
        "store": r.get("store"),
        "result_count": r.get("result_count"),
    }
    if r.get("message"):
        slimmed["message"] = r["message"]
    if r.get("products"):
        slimmed["products"] = [_slim_product(p) for p in r["products"]]
    return slimmed


def _format_product_row(i: int, p: Dict[str, Any]) -> str:
    """Format a single product as a markdown table row."""
    name = p.get("name") or p.get("title", "Unknown")
    price = p.get("display_price") or p.get("price") or "N/A"
    sizing = p.get("package_sizing") or ""
    was = p.get("was_price")
    member = p.get("member_only_price")
    deal = p.get("deal") or ""
    img = p.get("image_url") or ""

    extras = []
    if was:
        extras.append(f"~~{was}~~")
    if member:
        extras.append(f"Member: {member}")
    if deal:
        extras.append(deal)
    extra_str = " | ".join(extras)

    img_md = f"![img]({img})" if img else ""
    return f"| {i} | {img_md} | {name} | {price} | {sizing} | {extra_str} |"


def _format_results(store: str, items_results: List[Dict[str, Any]]) -> str:
    """Build a markdown summary from all item search results."""
    sections = []
    for r in items_results:
        query = r.get("query", "?")
        status = r.get("status", "error")

        if status == "error":
            sections.append(
                f"<details open>\n<summary><strong>{query}</strong> — Error</summary>\n\n"
                f"{r.get('message', 'Unknown error')}\n\n</details>\n"
            )
            continue
        if status == "not_found":
            sections.append(
                f"<details open>\n<summary><strong>{query}</strong> — No products found</summary>\n\n"
                f"No products found.\n\n</details>\n"
            )
            continue

        products = r.get("products", [])
        count = r.get("result_count", len(products))
        table = "| # | Image | Product | Price | Size | Notes |\n|---|-------|---------|-------|------|-------|\n"
        rows = [_format_product_row(i + 1, p) for i, p in enumerate(products)]
        sections.append(
            f"<details open>\n<summary><strong>{query}</strong> — {count} results</summary>\n\n"
            + table + "\n".join(rows) + "\n\n</details>\n"
        )

    title = f"## Live Prices from {store}\n\n"
    return title + "\n".join(sections)


async def search_store_prices(
    store: str,
    items: list,
    max_results_per_item: int = 10,
    detailed: bool = False,
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Search for current shelf prices at a Canadian grocery store.

    Args:
        store: Store name (e.g. "Loblaws", "No Frills", "Metro").
        items: List of item names to search for (e.g. ["chicken breast", "eggs"]).
        max_results_per_item: Max products to return per item. Defaults to 10.
        detailed: If False (default), item_results contain only essential pricing
            fields (name, brand, price, deal, sizing). If True, include all fields
            (description, images, links, ratings, etc). Use detailed=True only when
            the user asks about specific product attributes like ingredients,
            nutrition, or descriptions.

    Returns:
        Dict with formatted_markdown and raw per-item results.
    """
    log_id = f"[LivePricingTool:{store}]"
    log.info(f"{log_id} Searching for {len(items)} items: {items}")

    fetch_fn = _resolve_store(store)
    if fetch_fn is None:
        supported = ", ".join(_SUPPORTED_STORES)
        return {
            "status": "error",
            "message": f"Store '{store}' is not supported. Supported stores: {supported}",
        }

    results: List[Dict[str, Any]] = []
    for item in items:
        try:
            r = await fetch_fn(query=item, max_results=max_results_per_item)
            results.append(r)
        except Exception as e:
            log.error(f"{log_id} Error fetching '{item}': {e}", exc_info=True)
            results.append({
                "status": "error",
                "query": item,
                "store": store,
                "message": str(e),
            })

    formatted = _format_results(store, results)
    log.info(f"{log_id} Done. {len(results)} item searches completed.")

    # Slim down item_results unless detailed mode is requested
    item_results = results if detailed else [_slim_item_result(r) for r in results]

    return {
        "status": "success",
        "store": store,
        "formatted_markdown": formatted,
        "item_results": item_results,
    }
