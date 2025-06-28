# llm/prompts.py

EXTRACT_PROMPT = """
Extract hierarchical mind-map nodes from this transcript JSON.
You MUST return ONLY a valid JSON object with a "nodes" array. Each node must have:
- id: unique string identifier
- text: the node content
- parent: parent node id (null for root nodes)

DO NOT return any text, outline, explanation, or markdown. If you do not return valid JSON, the system will break and your output will be discarded.

Transcript:
{transcript}

Return format: {{"nodes": [{{"id": "1", "text": "...", "parent": null}}]}}
"""

MERGE_PROMPT = """
Merge newNodes into existingMap, avoiding duplicates.

You MUST return ONLY a valid JSON object with the merged nodes. Do NOT return any text, outline, explanation, or markdown. If you do not return valid JSON, the system will break and your output will be discarded.

ExistingMap: {existing}
NewNodes:    {new}

Return format: {{"nodes": [{{"id": "1", "text": "...", "parent": null}}]}}
""" 