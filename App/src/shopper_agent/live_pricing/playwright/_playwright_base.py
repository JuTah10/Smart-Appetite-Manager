"""Shared Playwright browser logic for stores that require JS rendering.

Metro, Food Basics, Giant Tiger, Voila (Sobeys), and FreshCo don't serve
product data in SSR HTML — they require a real browser to render the DOM.
This module provides a shared browser pool so multiple concurrent requests
reuse a single Chromium instance instead of spawning one per call.
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from playwright.async_api import async_playwright, Page, Browser, Playwright

log = logging.getLogger(__name__)

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

_WEBDRIVER_HIDE = (
    'Object.defineProperty(navigator, "webdriver", {get: () => undefined})'
)

# Shared browser state
_lock = asyncio.Lock()
_pw: Playwright | None = None
_browser: Browser | None = None
_ref_count: int = 0


async def _get_browser() -> Browser:
    """Return the shared browser, launching it if needed."""
    global _pw, _browser, _ref_count
    async with _lock:
        if _browser is None or not _browser.is_connected():
            if _pw is None:
                _pw = await async_playwright().start()
            _browser = await _pw.chromium.launch(headless=True)
            log.debug("[PlaywrightPool] Launched shared Chromium")
        _ref_count += 1
        return _browser


async def _release_browser() -> None:
    """Decrement ref count. Browser stays alive for reuse."""
    global _ref_count
    async with _lock:
        _ref_count = max(0, _ref_count - 1)


async def shutdown_browser() -> None:
    """Explicitly close the shared browser. Call on app shutdown."""
    global _pw, _browser, _ref_count
    async with _lock:
        if _browser is not None:
            await _browser.close()
            _browser = None
        if _pw is not None:
            await _pw.stop()
            _pw = None
        _ref_count = 0
        log.debug("[PlaywrightPool] Shut down shared Chromium")


@asynccontextmanager
async def headless_page(timeout: int = 20000) -> AsyncGenerator[Page, None]:
    """Yield a Playwright page from the shared browser pool.

    Each call creates a new browser context (isolated cookies/storage)
    but reuses the same Chromium process.

    Usage::

        async with headless_page() as page:
            await page.goto(url)
            html = await page.content()
    """
    browser = await _get_browser()
    context = await browser.new_context(
        viewport={"width": 1920, "height": 1080},
        user_agent=_USER_AGENT,
    )
    context.set_default_timeout(timeout)
    page = await context.new_page()
    await page.add_init_script(_WEBDRIVER_HIDE)
    try:
        yield page
    finally:
        await context.close()
        await _release_browser()
