import google.generativeai as genai
from google.generativeai.types import Tool
import json
import os
from llm.tools import extract_structure, merge_maps, get_memory, set_memory
from core.config import GEMINI_MODEL

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
        
        prompt = f"""
        You are an AI agent that creates mind maps from transcripts. You have access to 4 tools:

        1. get_memory - Retrieve stored mind map memory for a session
        2. extract_structure - Extract mind map nodes from transcript chunks
        3. merge_maps - Merge new nodes into an existing mind map structure
        4. set_memory - Store mind map memory for a session

        Follow these steps:
        1. First, use get_memory to retrieve any existing mind map for this session
        2. Use extract_structure with the transcript chunks to get new nodes
        3. Use merge_maps to combine the new nodes with the existing mind map
        4. Use set_memory to store the updated mind map for future sessions

        Transcript: {transcript_text}
        Session ID: {session_id or 'default'}
        Existing mind map: {existing_map}

        Please execute the tools in sequence to create and store the final mind map.
        """

        response = self.model.generate_content(prompt)
        tool_calls = []  # Track MCP tool calls
        
        # Handle function calls properly
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and candidate.content:
                for part in candidate.content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        # Execute the tool
                        tool_name = part.function_call.name
                        tool_args = part.function_call.args
                        
                        # Track the tool call
                        tool_calls.append({
                            "tool": tool_name,
                            "args": tool_args
                        })
                        
                        print(f"🔧 MCP Agent calling tool: {tool_name} with args: {tool_args}")
                        
                        if tool_name in self.tool_functions:
                            try:
                                if tool_name == "extract_structure":
                                    result = self.tool_functions[tool_name](chunks)
                                    print(f"✅ Tool {tool_name} executed successfully, result: {result}")
                                    # Add tool calls to result
                                    if isinstance(result, dict):
                                        result["mcp_tool_calls"] = tool_calls
                                    return result
                                elif tool_name == "merge_maps":
                                    result = self.tool_functions[tool_name](existing_map, tool_args.get("new_nodes", []))
                                    print(f"✅ Tool {tool_name} executed successfully, result: {result}")
                                    # Add tool calls to result
                                    if isinstance(result, dict):
                                        result["mcp_tool_calls"] = tool_calls
                                    return result
                                elif tool_name == "get_memory":
                                    result = self.tool_functions[tool_name](tool_args.get("session_id", session_id))
                                    print(f"✅ Tool {tool_name} executed successfully, result: {result}")
                                    # Add tool calls to result
                                    if isinstance(result, dict):
                                        result["mcp_tool_calls"] = tool_calls
                                    return result
                                elif tool_name == "set_memory":
                                    result = self.tool_functions[tool_name](tool_args.get("session_id", session_id), tool_args.get("memory_data", {}))
                                    print(f"✅ Tool {tool_name} executed successfully, result: {result}")
                                    # Add tool calls to result
                                    if isinstance(result, dict):
                                        result["mcp_tool_calls"] = tool_calls
                                    return result
                                else:
                                    result = self.tool_functions[tool_name](**tool_args)
                                    print(f"✅ Tool {tool_name} executed successfully, result: {result}")
                                    # Add tool calls to result
                                    if isinstance(result, dict):
                                        result["mcp_tool_calls"] = tool_calls
                                    return result
                            except Exception as e:
                                print(f"❌ Error executing tool {tool_name}: {e}")
                                error_result = {"error": f"Tool execution failed: {e}"}
                                error_result["mcp_tool_calls"] = tool_calls
                                return error_result
        
        # Fallback to text response
        print("📝 MCP Agent returning text response (no function calls detected)")
        text_response = response.text or (response.candidates[0].content.parts[0].text if response.candidates else "No response")
        print(f"📝 Text response: {text_response}")
        
        # Return text response with tool calls info
        return {
            "text": text_response,
            "mcp_tool_calls": tool_calls
        } 