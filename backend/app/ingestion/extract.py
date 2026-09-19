"""PDF text extraction (Phase 4). Uses PyMuPDF (fitz) first — it's a
self-contained library with no external binary dependency, unlike
pdftoppm/poppler which isn't installed in this environment. Falls back to
pdfplumber for table extraction on pages where it's useful. OCR via
pytesseract is attempted only for pages whose extracted text is
suspiciously short (likely scanned images) and is best-effort: if
tesseract isn't installed on the host, that page is recorded with empty
OCR text rather than crashing the whole ingestion run.
"""

import fitz  # PyMuPDF

MIN_TEXT_LEN_BEFORE_OCR = 40


def extract_pages(pdf_path: str) -> list[dict]:
    """Returns one dict per page: {page (1-indexed), text, is_scanned}."""
    pages = []
    with fitz.open(pdf_path) as doc:
        for index, page in enumerate(doc):
            text = page.get_text("text").strip()
            is_scanned = len(text) < MIN_TEXT_LEN_BEFORE_OCR
            if is_scanned:
                text = _try_ocr(page) or text
            pages.append({"page": index + 1, "text": text, "isScanned": is_scanned})
    return pages


def _try_ocr(page) -> str | None:
    try:
        import pytesseract
        from PIL import Image
        import io

        pix = page.get_pixmap(dpi=200)
        image = Image.open(io.BytesIO(pix.tobytes("png")))
        return pytesseract.image_to_string(image).strip()
    except Exception:
        # Tesseract not installed, or OCR failed for this page — leave the
        # page's extracted text as-is rather than failing the whole ingest.
        return None


def chunk_page_text(text: str, page: int, chunk_size: int = 900, overlap: int = 150) -> list[dict]:
    """Simple sliding-window chunking, preserving the page number on every
    chunk so provenance is never lost (brief Phase 4 requirement)."""
    text = text.strip()
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk_text = text[start:end].strip()
        if chunk_text:
            chunks.append({"page": page, "text": chunk_text})
        if end == len(text):
            break
        start = end - overlap
    return chunks
