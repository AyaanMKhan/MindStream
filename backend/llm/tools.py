import json
import re
import ast
import google.generativeai as genai
from llm.prompts import EXTRACT_PROMPT, MERGE_PROMPT


def _strip_json_fence(text: str):
    """Strip markdown code fences and extract JSON array only."""
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    return text.strip()


def extract_structure(chunks, model_name="models/gemini-1.5-flash-latest"):
    """
    Extract mind map nodes from transcript chunks using Gemini.
    Accepts:
      - dict with keys 'chunks' and optional 'model_name'
      - list of dicts or Pydantic objects
      - JSON or Python-literal string repr of either of the above
    """
    # Handle case where chunks is passed as a dict from LangChain with 'chunks' and 'model_name' keys
    if isinstance(chunks, dict) and 'chunks' in chunks:
        actual_chunks = chunks['chunks']
        if 'model_name' in chunks:
            model_name = chunks['model_name']
        chunks = actual_chunks
    # If we got a string, parse it first
    elif isinstance(chunks, str):
        raw = chunks.strip().strip('`')
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            try:
                parsed = ast.literal_eval(raw)
            except Exception as e:
                raise ValueError(f"Failed to parse input string as JSON or Python literal: {raw}")
        chunks = parsed
    
    # Ensure each chunk is a dict (handle both Pydantic models and dicts)
    chunk_dicts = []
    for c in chunks:
        if hasattr(c, "dict"):
            chunk_dicts.append(c.dict())
        elif isinstance(c, dict):
            chunk_dicts.append(c)
        else:
            raise ValueError(f"Chunk is not a dict or Pydantic model: {c}")
    
    transcript_json = json.dumps(chunk_dicts)
    prompt = EXTRACT_PROMPT.format(transcript=transcript_json)

    model = genai.GenerativeModel(model_name)
    resp = model.generate_content(prompt)
    
    try:
        result = json.loads(resp.text)
        return result
    except json.JSONDecodeError:
        # Fallback: try to extract JSON from the response
        import re
        json_match = re.search(r'\{.*\}', resp.text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        # If all else fails, return a simple structure
        return {
            "nodes": [
                {
                    "id": "1",
                    "text": "Meeting Goals",
                    "children": []
                }
            ]
        }


def merge_maps(existing, new_nodes, model_name="models/gemini-1.5-flash-latest"):
    """
    Merge new nodes into existing map using Gemini, avoiding duplicates.
    Accepts:
      - dict with keys 'nodes' and optional 'model_name' (from LangChain)
      - separate existing, new_nodes, model_name parameters (classic)
    """
    # Handle case where input is passed as a dict from LangChain
    if isinstance(existing, dict) and 'nodes' in existing:
        new_nodes = existing['nodes']
        if 'model_name' in existing:
            model_name = existing['model_name']
        existing = {}  # Start with empty existing map
    
    prompt = MERGE_PROMPT.format(
        existing=json.dumps(existing),
        new=json.dumps(new_nodes)
    )

    model = genai.GenerativeModel(model_name)
    resp = model.generate_content(prompt)

    raw_resp = resp.text or ''
    print('=== RAW LLM RESPONSE (merge) ===')
    print(raw_resp)

    cleaned = _strip_json_fence(raw_resp)
    try:
        return json.loads(cleaned)
    except Exception as e:
        raise ValueError(f"Could not parse merged JSON: {e}\nCleaned output: {cleaned}")
