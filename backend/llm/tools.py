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
      - plain text string (from LangChain)
    """
    # Handle case where chunks is passed as a dict from LangChain with 'chunks' and 'model_name' keys
    if isinstance(chunks, dict) and 'chunks' in chunks:
        actual_chunks = chunks['chunks']
        if 'model_name' in chunks:
            model_name = chunks['model_name']
        chunks = actual_chunks
    # If we got a string, check if it's JSON or plain text
    elif isinstance(chunks, str):
        raw = chunks.strip().strip('`')
        try:
            parsed = json.loads(raw)
            chunks = parsed
        except json.JSONDecodeError:
            try:
                parsed = ast.literal_eval(raw)
                chunks = parsed
            except Exception:
                # If it's not JSON or Python literal, treat as plain text
                # Create a single chunk from the text
                chunks = [{"start": 0.0, "end": 100.0, "text": raw}]
    
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
        json_match = re.search(r'\{[^{}]*"nodes"[^{}]*\[[^\]]*\][^{}]*\}', resp.text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        # If all else fails, return a simple structure
        print(f"Could not parse extract JSON, returning fallback structure")
        return {
            "nodes": [
                {
                    "id": "1",
                    "text": "Meeting Goals",
                    "parent": None
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
    
    # Handle case where new_nodes is the result from extract_structure
    if isinstance(new_nodes, dict) and 'nodes' in new_nodes:
        new_nodes = new_nodes['nodes']
    
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
        # If JSON parsing fails, try to extract JSON from JavaScript code
        try:
            # Look for JSON object in the response
            import re
            json_match = re.search(r'\{[^{}]*"nodes"[^{}]*\[[^\]]*\][^{}]*\}', raw_resp, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except:
            pass
        
        # If all else fails, just return the new nodes as the merged result
        print(f"Could not parse merged JSON, returning new nodes as fallback: {e}")
        return {"nodes": new_nodes if isinstance(new_nodes, list) else []}


def get_memory(session_id, model_name="models/gemini-1.5-flash-latest"):
    """
    Get stored memory for a session.
    """
    from mcp.memory import agent_memory
    return agent_memory.get(session_id, {})

def set_memory(session_id, memory_data, model_name="models/gemini-1.5-flash-latest"):
    """
    Set memory for a session.
    """
    from mcp.memory import agent_memory
    agent_memory[session_id] = memory_data
    return {"status": "success", "session_id": session_id}
