# llm/prompts.py

EXTRACT_PROMPT = """
Extract hierarchical mind-map nodes from this transcript JSON.
Return ONLY a JSON object with a "nodes" array. Each node should have:
- id: unique string identifier
- text: the node content
- parent: parent node id (null for root nodes)

Do not include any code, explanations, or markdown formatting. Return only the JSON.

Transcript:
{transcript}

Return format: {{"nodes": [{{"id": "1", "text": "...", "parent": null}}]}}
"""

MERGE_PROMPT = """
Merge newNodes into existingMap, avoiding duplicates.

Return ONLY a JSON object with the merged nodes. Do not include any code, explanations, or markdown formatting.

ExistingMap: {existing}
NewNodes:    {new}

Return format: {{"nodes": [{{"id": "1", "text": "...", "parent": null}}]}}
""" 