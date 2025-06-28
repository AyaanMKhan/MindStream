import google.generativeai as genai
from google.generativeai.types import Tool
import json
import os
from llm.tools import extract_structure, merge_maps
from core.config import GEMINI_MODEL

class MindMapAgentMCP:
    def __init__(self):
        # Load tool schemas from existing MCP JSON files
        mcp_dir = os.path.join(os.path.dirname(__file__), '..', 'mcp')
        
        with open(os.path.join(mcp_dir, 'extract_structure.json'), 'r') as f:
            extract_schema = json.load(f)
        
        with open(os.path.join(mcp_dir, 'merge_maps.json'), 'r') as f:
            merge_schema = json.load(f)
        
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
        
        self.model = genai.GenerativeModel(
            model_name=f"models/{GEMINI_MODEL}",
            tools=[extract_tool, merge_tool]
        )
        
        # Store tool functions for execution
        self.tool_functions = {
            "extract_structure": extract_structure,
            "merge_maps": merge_maps
        }

    def run(self, transcript_text, existing_map={}):
        # Convert transcript text to chunks format
        chunks = [{"start": 0.0, "end": 100.0, "text": transcript_text}]
        
        prompt = f"""
        You are an AI agent that creates mind maps from transcripts. You have access to 2 tools:

        1. extract_structure - Extract mind map nodes from transcript chunks
        2. merge_maps - Merge new nodes into an existing mind map structure

        Follow these steps:
        1. First, use extract_structure with the transcript chunks to get new nodes
        2. Then, use merge_maps to combine the new nodes with the existing mind map

        Transcript: {transcript_text}
        Existing mind map: {existing_map}

        Please execute both tools in sequence to create the final mind map.
        """

        response = self.model.generate_content(prompt)
        
        # Handle function calls properly
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and candidate.content:
                for part in candidate.content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        # Execute the tool
                        tool_name = part.function_call.name
                        tool_args = part.function_call.args
                        
                        print(f"🔧 MCP Agent calling tool: {tool_name} with args: {tool_args}")
                        
                        if tool_name in self.tool_functions:
                            try:
                                if tool_name == "extract_structure":
                                    result = self.tool_functions[tool_name](chunks)
                                    print(f"✅ Tool {tool_name} executed successfully, result: {result}")
                                    return result
                                elif tool_name == "merge_maps":
                                    result = self.tool_functions[tool_name](existing_map, tool_args.get("new_nodes", []))
                                    print(f"✅ Tool {tool_name} executed successfully, result: {result}")
                                    return result
                                else:
                                    result = self.tool_functions[tool_name](**tool_args)
                                    print(f"✅ Tool {tool_name} executed successfully, result: {result}")
                                    return result
                            except Exception as e:
                                print(f"❌ Error executing tool {tool_name}: {e}")
                                return {"error": f"Tool execution failed: {e}"}
        
        # Fallback to text response
        print("📝 MCP Agent returning text response (no function calls detected)")
        text_response = response.text or (response.candidates[0].content.parts[0].text if response.candidates else "No response")
        print(f"📝 Text response: {text_response}")
        return text_response 