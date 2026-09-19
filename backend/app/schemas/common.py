from enum import Enum

from pydantic import BaseModel


class SourceType(str, Enum):
    PUBLIC_DOCUMENT = "public_document"
    GOVERNMENT_DATA = "government_data"
    GEOSPATIAL_DATA = "geospatial_data"
    DERIVED = "derived"
    SYNTHETIC_DEMO = "synthetic_demo"


class ErrorResponse(BaseModel):
    error: str
    message: str
    detail: dict | None = None


# NOTE: Schema field names below are deliberately spelled in camelCase,
# copied 1:1 from the frontend's existing TypeScript interfaces (see
# docs/FRONTEND_INTEGRATION_ANALYSIS.md §1). This is intentional: the brief
# requires preserving the frontend's interfaces exactly, and hand-copying
# each field name is more reliable than a camelCase alias-generator, which
# cannot faithfully round-trip irregular acronym casing like "mudWeightSG"
# or "torqueKNm".
