from llm.tools import extract_structure, merge_maps

# ✅ Your own tool wrapper (used by MindMapAgent)
class Tool:
    def __init__(self, name, func, description=""):
        self.name = name
        self.func = func
        self.description = description

    def run(self, *args, **kwargs):
        return self.func(*args, **kwargs)

# ✅ Internal tool registry (used by MindMapAgent)
TOOL_REGISTRY = {
    "extract": Tool(
        name="extract",
        func=extract_structure,
        description="Extract hierarchical mind-map nodes from transcript chunks"
    ),
    "merge": Tool(
        name="merge",
        func=merge_maps,
        description="Merge new nodes into existing mind map"
    ),
}
