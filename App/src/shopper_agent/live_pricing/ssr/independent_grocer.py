from typing import Any, Dict, Optional

from ._pcx_base import fetch_pcx_prices

_SEARCH_URL = "https://www.yourindependentgrocer.ca/en/search"
_STORE_NAME = "Your Independent Grocer"


async def get_independent_grocer_prices(
    query: str,
    max_results: int = 50,
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Fetch live shelf prices from Your Independent Grocer."""
    return await fetch_pcx_prices(_SEARCH_URL, _STORE_NAME, query, max_results)
