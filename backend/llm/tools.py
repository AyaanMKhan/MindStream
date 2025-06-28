import json
from llm.prompts import EXTRACT_PROMPT, MERGE_PROMPT
import google.generativeai as genai

def extract_structure(chunks, model_name="models/gemini-2.5-pro"):
    transcript_json = json.dumps([c.dict() for c in chunks])
    prompt = EXTRACT_PROMPT.format(transcript=transcript_json)
    model = genai.GenerativeModel(model_name)
    resp = model.generate_content(prompt)
    raw = resp.text or ""
    print("RAW LLM RESPONSE:", raw)
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    text = text.strip()
    if not text:
        raise ValueError("LLM returned empty response after stripping fences")
    return json.loads(text)

def merge_maps(existing, new_nodes, model_name="models/gemini-2.5-pro"):
    prompt = MERGE_PROMPT.format(
        existing=json.dumps(existing),
        new=json.dumps(new_nodes)
    )
    model = genai.GenerativeModel(model_name)
    resp = model.generate_content(prompt)
    return json.loads(resp.text) 