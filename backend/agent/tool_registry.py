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

# Helper wrapper for LangChain to handle structured arguments

def merge_maps_tool(*args, **kwargs):
    """
    Wrapper around merge_maps that accepts both positional and keyword args for LangChain.
    Handles cases where LangChain passes a single dict with keys 'existing' and 'new_nodes'.
    """
    # If called with a single dict argument (from LangChain)
    if len(args) == 1 and isinstance(args[0], dict):
        data = args[0]
        existing = data.get('existing', {})
        new_nodes = data.get('new_nodes', [])
        model_name = data.get('model_name', "models/gemini-1.5-flash-latest")
        return merge_maps(existing, new_nodes, model_name)
    # If called with two or three positional arguments
    elif len(args) >= 2:
        existing = args[0]
        new_nodes = args[1]
        model_name = args[2] if len(args) > 2 else "models/gemini-1.5-flash-latest"
        return merge_maps(existing, new_nodes, model_name)
    # If called with keyword arguments
    elif 'existing' in kwargs and 'new_nodes' in kwargs:
        existing = kwargs['existing']
        new_nodes = kwargs['new_nodes']
        model_name = kwargs.get('model_name', "models/gemini-1.5-flash-latest")
        return merge_maps(existing, new_nodes, model_name)
    else:
        raise ValueError("merge_maps_tool: Invalid arguments")

# ✅ LangChain-compatible tools
langchain_tools = [
    LangChainTool.from_function(
        name="extract_structure",
        func=extract_structure,
        description="Extract mind map nodes from transcript text. Input should be the transcript text as a string. Use this tool first to get initial nodes from the transcript."
    ),
    LangChainTool.from_function(
        name="merge_maps",
        func=merge_maps_tool,
        description="Merge new nodes into an existing mind map. Input should be the existing map (can be empty dict) and new nodes. Use this tool after extract_structure to organize the nodes."
    ),
]
