"""OCR microservice – extracts text from flyer images using Tesseract."""

import io
import logging

import httpx
import pytesseract
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageEnhance, ImageFilter
from pydantic import BaseModel

log = logging.getLogger(__name__)

app = FastAPI(
    title="OCR Service",
    description="Extracts text from flyer images via Tesseract OCR.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _preprocess_variants(img: Image.Image):
    """Yield (processed_image, psm_mode) tuples for OCR attempts."""
    # Grayscale + sharpen + high contrast (good for light text on dark bg)
    gray = img.convert("L")
    sharp = gray.filter(ImageFilter.SHARPEN)
    hi_contrast = ImageEnhance.Contrast(sharp).enhance(2.0)
    yield hi_contrast, 6

    # Binarized at multiple thresholds — catches small text like "675 g"
    for thresh in (100, 140, 180):
        binary = hi_contrast.point(lambda x, t=thresh: 255 if x > t else 0)
        yield binary, 6

    # Inverted binary — light text on dark background
    inverted = hi_contrast.point(lambda x: 255 if x < 100 else 0)
    yield inverted, 6

    # Original color, psm 4 (single column) — catches vertically stacked text
    yield img, 4


class ExtractRequest(BaseModel):
    image_url: str


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ocr-service"}


@app.post("/api/ocr/extract-text")
async def extract_text(body: ExtractRequest):
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; SmartAppetiteManager/1.0)"}
        async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
            resp = await client.get(body.image_url)
            resp.raise_for_status()

        img = Image.open(io.BytesIO(resp.content))

        # Preprocess for better OCR on small flyer images
        # 1. Upscale small images (flyer crops are often tiny)
        MIN_WIDTH = 1000
        if img.width < MIN_WIDTH:
            scale = MIN_WIDTH / img.width
            img = img.resize(
                (int(img.width * scale), int(img.height * scale)),
                Image.LANCZOS,
            )

        # 2. Try multiple preprocessing strategies, combine all results
        #    The caller (grocery_tools.py) runs regex over the text to find
        #    weight patterns like "675g", so combining gives the best chance.
        seen = set()
        parts = []
        for prep_img, psm in _preprocess_variants(img):
            try:
                t = pytesseract.image_to_string(prep_img, config=f"--psm {psm}").strip()
                if t and t not in seen:
                    seen.add(t)
                    parts.append(t)
            except Exception:
                pass

        text = "\n".join(parts)
        return {"status": "success", "text": text}
    except Exception as e:
        msg = f"{type(e).__name__}: {e}" if str(e) else type(e).__name__
        log.warning(f"[OCRService] Failed for {body.image_url}: {msg}", exc_info=True)
        return {"status": "error", "message": msg}
