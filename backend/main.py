from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import traceback
import re
import json

from agent.controller import MindMapAgent
from schemas.node import TranscriptChunk, MindMapNode, MapPayload, MapResponse

app = FastAPI()

# Add cache-busting middleware
class NoCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

app.add_middleware(NoCacheMiddleware)

# CORS — allow your React app on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate-map", response_model=MapResponse)
async def generate_map(payload: MapPayload):
    """
    Fast, deterministic mode — uses hardcoded extract + merge tools.
    """
    try:
        agent = MindMapAgent()
        agent.ingest_chunks(payload.chunks)
        result = agent.run()

        # Handle the result from agent.run() - it should return a dict with 'nodes'
        if isinstance(result, dict) and 'nodes' in result:
            nodes_data = result['nodes']
        else:
            nodes_data = result if isinstance(result, list) else []

        for node in nodes_data:
            node["id"] = str(node["id"])
            if node.get("parent") is not None:
                node["parent"] = str(node["parent"])

        nodes = [MindMapNode(**node) for node in nodes_data]
        return MapResponse(nodes=nodes)

    except Exception as e:
        tb = traceback.format_exc()
        print("=== ERROR IN /generate-map ===")
        print(tb)
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "trace": tb}
        )

@app.post("/generate-map/langchain")
async def generate_map_langchain(payload: MapPayload):
    """
    Smart mode — uses LangChain agent to dynamically choose tools.
    """
    try:
        agent = MindMapAgent()
        transcript_text = " ".join(chunk.text for chunk in payload.chunks)
        
        # More specific instruction that tells the agent how to use our tools
        user_query = f"""You have access to two tools:
1. extract_structure - Extract mind map nodes from transcript text
2. merge_maps - Merge new nodes into an existing mind map

To generate a mind map from this transcript, first use extract_structure to get the initial nodes, then use merge_maps to organize them.

Transcript: {transcript_text}"""

        result = agent.run_langchain_agent(user_query)
        
        # Parse the LangChain result to extract the mind map nodes
        print(f"LangChain result type: {type(result)}")
        print(f"LangChain result: {result}")
        
        if isinstance(result, str):
            # Try to extract JSON from the string response
            try:
                # Look for JSON object with nodes array (Python dict style)
                match = re.search(r'\{[^{}]*nodes[^{}]*\[[^\]]*\][^{}]*\}', result, re.DOTALL)
                if not match:
                    match = re.search(r'\{[^{}]*\}', result, re.DOTALL)
                if match:
                    json_str = match.group(0)
                    print(f"Extracted JSON: {json_str}")
                    # Convert Python dict style to JSON
                    json_str = (
                        json_str.replace("'", '"')
                                .replace('None', 'null')
                                .replace('True', 'true')
                                .replace('False', 'false')
                    )
                    parsed_data = json.loads(json_str)
                    if 'nodes' in parsed_data and isinstance(parsed_data['nodes'], list):
                        nodes = parsed_data['nodes']
                        print(f"Found {len(nodes)} nodes")
                        return {"result": nodes}
                    else:
                        print("No nodes array found in parsed data")
                        return {"result": []}
                else:
                    print("No JSON found in result string")
                    return {"result": []}
            except Exception as parse_error:
                print(f"Error parsing LangChain result: {parse_error}")
                return {"result": []}
        elif isinstance(result, dict) and 'nodes' in result:
            # If result is already in the correct format
            return {"result": result['nodes']}
        elif isinstance(result, list):
            # If result is already a list of nodes
            return {"result": result}
        else:
            # Fallback: return empty result
            print(f"Unexpected result format: {type(result)}")
            return {"result": []}

    except Exception as e:
        tb = traceback.format_exc()
        print("=== ERROR IN /generate-map/langchain ===")
        print(tb)
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "trace": tb}
        )
    
@app.post("/generate-map/fallback")
async def generate_map_fallback(payload: MapPayload):
    agent = MindMapAgent()
    try:
        agent.ingest_chunks(payload.chunks)
        transcript_text = " ".join(chunk.text for chunk in payload.chunks)
        user_query = f"Generate a mind map from this transcript: {transcript_text}"
        return {"result": agent.run_langchain_agent(user_query)}
    except:
        return {"nodes": agent.run()}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "MindStream API is running"}
