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

# Helper wrapper for LangChain to handle positional arguments correctly

def merge_maps_tool(existing, new_nodes, model_name="models/gemini-1.5-flash-latest"):
    """
    Wrapper around merge_maps that accepts positional args for LangChain
    """
    return merge_maps(existing=existing, new_nodes=new_nodes, model_name=model_name)

# ✅ LangChain-compatible tools
langchain_tools = [
    LangChainTool.from_function(
        name="extract_structure",
        func=lambda chunks, model_name="models/gemini-1.5-flash-latest": extract_structure(chunks, model_name),
        description="Extract nodes from transcript chunks"
    ),
    LangChainTool.from_function(
        name="merge_maps",
        func=lambda *args, **kwargs: merge_maps(
            existing=kwargs.get('existing', {}) or (args[0] if args else {}),
            new_nodes=kwargs.get('new_nodes', []) or kwargs.get('nodes', []),
            model_name=kwargs.get('model_name', 'models/gemini-1.5-flash-latest')
        ),
        description="Merge nodes into a mind map"
    ),
]
