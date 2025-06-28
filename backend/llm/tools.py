import json
import re
import google.generativeai as genai
from llm.prompts import EXTRACT_PROMPT, MERGE_PROMPT


def _strip_json_fence(text: str):
    """Strip markdown code fences and extract JSON array only."""
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)

    # Use regex to safely extract JSON array if possible
    match = re.search(r"(\[\s*{.*?}\s*\])", text, re.DOTALL)
    if match:
        return match.group(1).strip()

    return text.strip()


def extract_structure(chunks, model_name="models/gemini-2.5-pro"):
    """
    Extract mind map nodes from transcript chunks using Gemini.
    Each chunk should be a dict or pydantic object with .dict().
    """
    transcript_json = json.dumps([c.dict() for c in chunks])
    prompt = EXTRACT_PROMPT.format(transcript=transcript_json)

    model = genai.GenerativeModel(model_name)
    resp = model.generate_content(prompt)

    raw = resp.text or ""
    print("=== RAW LLM RESPONSE (extract) ===")
    print(raw)

    cleaned = _strip_json_fence(raw)

    try:
        return json.loads(cleaned)
    except Exception as e:
        raise ValueError(f"Failed to parse extract_structure JSON: {e}")


def merge_maps(existing, new_nodes, model_name="models/gemini-2.5-pro"):
    """
    Merge new nodes into existing map using Gemini. Handles duplicate avoidance.
    """
    prompt = MERGE_PROMPT.format(
        existing=json.dumps(existing),
        new=json.dumps(new_nodes)
    )

    model = genai.GenerativeModel(model_name)
    resp = model.generate_content(prompt)

    raw = resp.text or ""
    print("=== RAW LLM RESPONSE (merge) ===")
    print(raw)

    cleaned = _strip_json_fence(raw)

    try:
        return json.loads(cleaned)
    except Exception as e:
        raise ValueError(f"Failed to parse merge_maps JSON: {e}")
