"""Turns retrieved evidence into the RagChatResponse the frontend already
knows how to render (Phase 7/8). Strict grounding: the LLM (Groq, if
configured) is only ever shown the actually-retrieved evidence and is
instructed to answer solely from it; the deterministic fallback (no LLM
configured, or the LLM call fails) never invents content beyond
reformatting the evidence itself. INSUFFICIENT EVIDENCE is a first-class
outcome, not an error path.
"""

import math

from app.services.llm_provider import get_llm_provider

CONFIDENCE_FLOOR_FOR_SUFFICIENT_EVIDENCE = 0.30

SYSTEM_PROMPT = """You are eRTMAC-NWIS, a drilling-operations intelligence assistant for Oil India Limited (Assam-Arakan Basin).
You must answer STRICTLY and ONLY using the evidence excerpts provided below. Do not invent well names, incidents, \
depths, or figures that are not present in the evidence. If the evidence is insufficient to answer confidently, say so.
Every evidence item has a sourceType: "public_document"/"government_data" means it comes from a real Oil India/government \
source; "synthetic_demo" means it is labeled demonstration data, not a real OIL India record — never blur this distinction \
in your answer.
Respond ONLY with a valid JSON object matching exactly this schema:
{
  "summary": "2-3 sentence direct answer grounded in the evidence",
  "nearbyWellsAnalysis": "cross-reference of what the evidence says about nearby/offset wells, or 'Not applicable' if none",
  "rootCause": "root cause per the evidence, or 'Not established in available evidence'",
  "recommendedMitigation": "mitigation per the evidence if documented, else 'No documented mitigation in available evidence'",
  "confidenceScore": <int 0-100>,
  "riskLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "reasoningSteps": ["short factual steps describing how you used the evidence"]
}"""


def _sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))


def _confidence_from_scores(evidence: list[dict]) -> float:
    if not evidence:
        return 0.0
    top = evidence[0]["score"]
    # Cross-encoder scores are unbounded logits; BM25/vector-only scores are 0..1 already.
    normalized = _sigmoid(top) if abs(top) > 1.5 else top
    return max(0.0, min(1.0, normalized))


def _build_citations(evidence: list[dict]) -> list[dict]:
    citations = []
    for item in evidence:
        citations.append({
            "reportId": item.get("documentId", "unknown"),
            "reportType": None,
            "wellName": item.get("wellName") or item.get("documentName", "Unknown source"),
            "title": item.get("documentName"),
            "page": item.get("page", 0),
            "section": item.get("section") or "N/A",
            "ocrConfidence": None,
            "excerpt": item["text"][:600],
            "sourceType": item.get("sourceType", "derived"),
        })
    return citations


def _insufficient_evidence_response(query: str, reasoning_steps: list[str]) -> dict:
    return {
        "summary": "INSUFFICIENT EVIDENCE in the currently indexed sources to answer this query with confidence.",
        "nearbyWellsAnalysis": "No sufficiently relevant evidence retrieved.",
        "rootCause": "Not established — insufficient evidence.",
        "recommendedMitigation": "AI-GENERATED SUGGESTION: consult additional source documents or subject-matter experts before proceeding.",
        "confidenceScore": 0,
        "riskLevel": "LOW",
        "isInsufficientInfo": True,
        "reasoningSteps": reasoning_steps + ["No evidence cleared the confidence threshold; returning INSUFFICIENT EVIDENCE rather than speculating."],
        "citations": [],
    }


async def synthesize(query: str, evidence: list[dict], reasoning_steps: list[str]) -> dict:
    if not evidence or _confidence_from_scores(evidence) < CONFIDENCE_FLOOR_FOR_SUFFICIENT_EVIDENCE:
        return _insufficient_evidence_response(query, reasoning_steps)

    citations = _build_citations(evidence)
    confidence_pct = round(_confidence_from_scores(evidence) * 100)

    provider = get_llm_provider()
    if provider is not None:
        try:
            evidence_block = "\n\n".join(
                f"[Evidence {i+1}] source_type={e.get('sourceType')}, well={e.get('wellName') or 'N/A'}, "
                f"document={e.get('documentName')}, page={e.get('page')}\n{e['text'][:800]}"
                for i, e in enumerate(evidence)
            )
            user_prompt = f"User query: {query}\n\nEvidence:\n{evidence_block}"
            parsed = await provider.generate_json(SYSTEM_PROMPT, user_prompt)
            return {
                **parsed,
                "isInsufficientInfo": False,
                "citations": citations,
                "reasoningSteps": reasoning_steps + list(parsed.get("reasoningSteps", [])),
            }
        except Exception:
            pass  # fall through to deterministic synthesis below

    top = evidence[0]
    return {
        "summary": f"Based on {len(evidence)} retrieved evidence item(s), the most relevant excerpt "
                   f"(from {top.get('documentName')}, page {top.get('page')}) states: "
                   f"\"{top['text'][:300].strip()}\"",
        "nearbyWellsAnalysis": "; ".join(
            f"{e.get('wellName') or e.get('documentName')} (p.{e.get('page')})" for e in evidence[:3]
        ),
        "rootCause": "See cited evidence excerpts for documented root cause detail.",
        "recommendedMitigation": "AI-GENERATED SUGGESTION: review the full cited source document(s) for the documented mitigation procedure before acting.",
        "confidenceScore": confidence_pct,
        "riskLevel": "HIGH" if confidence_pct >= 70 else "MEDIUM" if confidence_pct >= 40 else "LOW",
        "isInsufficientInfo": False,
        "reasoningSteps": reasoning_steps + ["No LLM provider available or LLM call failed; synthesized directly from top-ranked evidence (deterministic fallback)."],
        "citations": citations,
    }
