import google.generativeai as genai
from google.generativeai.types import Tool
import json
import os
from llm.tools import extract_structure, merge_maps, get_memory, set_memory
from core.config import GEMINI_MODEL

def make_serializable(obj):
    # Recursively convert proto objects and other non-serializables to dict or str
    if hasattr(obj, 'items') and callable(obj.items):
        # Likely a proto MapComposite or similar
        return {k: make_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_serializable(i) for i in obj]
    elif hasattr(obj, '__dict__'):
        return {k: make_serializable(v) for k, v in obj.__dict__.items()}
    else:
        try:
            json.dumps(obj)
            return obj
        except Exception:
            return str(obj)

class MindMapAgentMCP:
    def __init__(self):
        # Load tool schemas from existing MCP JSON files
        mcp_dir = os.path.join(os.path.dirname(__file__), '..', 'mcp')
        
        with open(os.path.join(mcp_dir, 'extract_structure.json'), 'r') as f:
            extract_schema = json.load(f)
        
        with open(os.path.join(mcp_dir, 'merge_maps.json'), 'r') as f:
            merge_schema = json.load(f)
            
        with open(os.path.join(mcp_dir, 'get_memory.json'), 'r') as f:
            get_memory_schema = json.load(f)
            
        with open(os.path.join(mcp_dir, 'set_memory.json'), 'r') as f:
            set_memory_schema = json.load(f)
        
        # Create tool objects from loaded schemas
        extract_tool = Tool(
            function_declarations=[{
                "name": extract_schema["name"],
                "description": extract_schema["description"],
                "parameters": extract_schema["parameters"]
            }]
        )
        
        merge_tool = Tool(
            function_declarations=[{
                "name": merge_schema["name"],
                "description": merge_schema["description"],
                "parameters": merge_schema["parameters"]
            }]
        )
        
        get_memory_tool = Tool(
            function_declarations=[{
                "name": get_memory_schema["name"],
                "description": get_memory_schema["description"],
                "parameters": get_memory_schema["parameters"]
            }]
        )
        
        set_memory_tool = Tool(
            function_declarations=[{
                "name": set_memory_schema["name"],
                "description": set_memory_schema["description"],
                "parameters": set_memory_schema["parameters"]
            }]
        )
        
        self.model = genai.GenerativeModel(
            model_name=f"models/{GEMINI_MODEL}",
            tools=[extract_tool, merge_tool, get_memory_tool, set_memory_tool]
        )
        
        # Store tool functions for execution
        self.tool_functions = {
            "extract_structure": extract_structure,
            "merge_maps": merge_maps,
            "get_memory": get_memory,
            "set_memory": set_memory
        }

    def run(self, transcript_text, existing_map={}, session_id=None):
        # Convert transcript text to chunks format
        chunks = [{"start": 0.0, "end": 100.0, "text": transcript_text}]
        tool_calls = []
        try:
            # 1. Get memory
            memory = self.tool_functions["get_memory"](session_id)
            tool_calls.append({"tool": "get_memory", "args": {"session_id": session_id}})
            # 2. Extract structure
            new_nodes = self.tool_functions["extract_structure"](chunks)
            tool_calls.append({"tool": "extract_structure", "args": {"chunks": chunks}})
            # 3. Merge maps
            merged = self.tool_functions["merge_maps"](memory.get("nodes", []), new_nodes.get("nodes", []))
            tool_calls.append({"tool": "merge_maps", "args": {"existing_map": memory.get("nodes", []), "new_nodes": new_nodes.get("nodes", [])}})
            # 4. Set memory
            self.tool_functions["set_memory"](session_id, merged)
            tool_calls.append({"tool": "set_memory", "args": {"session_id": session_id, "memory_data": merged}})
            # 5. Return final result
            merged["mcp_tool_calls"] = tool_calls
            return merged
        except Exception as e:
            print(f"❌ Error in MCP agent pipeline: {e}")
            return {"error": str(e), "mcp_tool_calls": tool_calls} 