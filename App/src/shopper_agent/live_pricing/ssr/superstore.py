from typing import Any, Dict, Optional

from ._pcx_base import fetch_pcx_prices

_SEARCH_URL = "https://www.realcanadiansuperstore.ca/en/search"
_STORE_NAME = "Real Canadian Superstore"


async def get_superstore_prices(
    query: str,
    max_results: int = 50,
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Fetch live shelf prices from Real Canadian Superstore."""
    return await fetch_pcx_prices(_SEARCH_URL, _STORE_NAME, query, max_results)
