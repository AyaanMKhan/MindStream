EXTRACT_PROMPT = """
Extract hierarchical mind-map nodes from this transcript JSON.
Return a JSON array of nodes with id, text, parent, importance (1-5), and node_type.

Transcript:
{transcript}
"""

MERGE_PROMPT = """
Merge newNodes into existingMap, avoiding duplicates.
Assign each node an importance 1-5 based on mentions or action cues.

ExistingMap: {existing}
NewNodes:    {new}
"""