# llm/prompts.py

EXTRACT_PROMPT = """
Extract a detailed, hierarchical mind map from the following transcript JSON. Identify ALL main topics, subtopics, decisions, and action items. Capture every distinct agenda item, discussion point, and outcome as a node. Use a tree structure: each node must have an id, text, and parent (null for root nodes). Include as many relevant branches and subtopics as possible.

You MUST return ONLY a valid JSON object with a "nodes" array. Each node must have:
- id: unique string identifier
- text: the node content (short, descriptive)
- parent: parent node id (null for root nodes)

DO NOT return any text, outline, explanation, or markdown. If you do not return valid JSON, the system will break and your output will be discarded.

Transcript:
{transcript}

Return format:
{{
  "nodes": [
    {{"id": "1", "text": "Meeting Goals", "parent": null}},
    {{"id": "2", "text": "Scheduling Process", "parent": "1"}},
    {{"id": "3", "text": "Outlook vs Webtracker", "parent": "2"}},
    {{"id": "4", "text": "Double Bookings Issue", "parent": "2"}},
    {{"id": "5", "text": "Solution: Use Webtracker", "parent": "2"}},
    {{"id": "6", "text": "Policy Updates", "parent": "1"}},
    {{"id": "7", "text": "Staff Training", "parent": "1"}},
    {{"id": "8", "text": "Email Communication", "parent": "1"}},
    {{"id": "9", "text": "Subject Line Standards", "parent": "8"}},
    {{"id": "10", "text": "Priority Labels", "parent": "8"}},
    {{"id": "11", "text": "Office Party Planning", "parent": "1"}},
    {{"id": "12", "text": "Volunteers", "parent": "11"}}
  ]
}}
"""

MERGE_PROMPT = """
Merge newNodes into existingMap, avoiding duplicates.

You MUST return ONLY a valid JSON object with the merged nodes. Do NOT return any text, outline, explanation, or markdown. If you do not return valid JSON, the system will break and your output will be discarded.

ExistingMap: {existing}
NewNodes:    {new}

Return format: {{"nodes": [{{"id": "1", "text": "...", "parent": null}}]}}
""" 