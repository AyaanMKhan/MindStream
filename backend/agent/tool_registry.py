# agent/tool_registry.py

from llm.tools import extract_structure, merge_maps
from langchain.tools import Tool as LangChainTool

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

# ✅ LangChain-compatible tools
langchain_tools = [
    LangChainTool.from_function(
        name="extract_structure",
        func=lambda chunks, model_name="models/gemini-2.5-pro": extract_structure(chunks, model_name),
        description="Extract nodes from transcript chunks"
    ),
    LangChainTool.from_function(
        name="merge_maps",
        func=lambda existing, new_nodes, model_name="models/gemini-2.5-pro": merge_maps(existing, new_nodes, model_name),
        description="Merge nodes into a mind map"
    ),
]
