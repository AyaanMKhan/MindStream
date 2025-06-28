from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import traceback
import os
import assemblyai as aai
import re
import json

from agent.controller import MindMapAgent
from schemas.node import TranscriptChunk, MindMapNode, MapPayload, MapResponse

from utils import db
from schemas import model
from bson import ObjectId
app = FastAPI()
col_mindmap, col_gallery = None, None
# CORS — allow your React app on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    global col_mindmap, col_gallery
    await db.connect_db()
    if db.database is None:
        raise RuntimeError("❌ MongoDB failed to initialize on startup.")
    
    col_mindmap = db.database.mindmaps
    col_gallery = db.database.gallery

@app.on_event("shutdown")
async def shutdown():
    await db.shutdown_db()

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
                        # Fallback: try to parse as outline
                        nodes_json = try_parse_outline(result)
                        if nodes_json:
                            return {"result": nodes_json["nodes"]}
                        return JSONResponse(
                            status_code=500,
                            content={"error": "AI did not return a valid mind map. Please try again or rephrase your input."}
                        )
                else:
                    print("No JSON found in result string")
                    # Fallback: try to parse as outline
                    nodes_json = try_parse_outline(result)
                    if nodes_json:
                        return {"result": nodes_json["nodes"]}
                    return JSONResponse(
                        status_code=500,
                        content={"error": "AI did not return a valid mind map. Please try again or rephrase your input."}
                    )
            except Exception as parse_error:
                print(f"Error parsing LangChain result: {parse_error}")
                # Fallback: try to parse as outline
                nodes_json = try_parse_outline(result)
                if nodes_json:
                    return {"result": nodes_json["nodes"]}
                return JSONResponse(
                    status_code=500,
                    content={"error": "AI did not return a valid mind map. Please try again or rephrase your input."}
                )
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

@app.post("/mindmap")
def insert_mindmap(mindmap: model.MindMap):
    mindmapDict = mindmap.dict()
    result = col_mindmap.insert_one(mindmapDict)
    return {"inserted_id": str(result.inserted_id)}

@app.get("/mindmap/{id}")
def get_mindmap(id: str):
    try:
        result = collection.find_one({"_id": ObjectId(id)})
        if not result:
            raise HTTPException(status_code=404, detail="MindMap not found")
        result["_id"] = str(result["_id"])
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    if db.database is None:
        raise HTTPException(status_code=500, detail="MongoDB not initialized.")
    try:
        db.client.admin.command("ping")
        return {"status": "✅ MongoDB connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MongoDB error: {e}")
    return {"status": "healthy", "message": "MindStream API is running"}

def try_parse_outline(text_outline):
    """
    Try to parse a text outline (tree structure) into a nodes JSON format.
    Returns a dict with a 'nodes' key if successful, else None.
    """
    import re
    lines = [line for line in text_outline.splitlines() if line.strip()]
    nodes = []
    stack = []  # Stack of (id, indent_level)
    id_counter = 1

    for line in lines:
        # Normalize: replace tree characters with spaces
        norm_line = line.replace('├', ' ').replace('└', ' ').replace('│', ' ')
        # Count indentation (number of leading spaces)
        indent = len(norm_line) - len(norm_line.lstrip(' '))
        clean_text = norm_line.strip('- ').strip()
        if not clean_text or clean_text == "...":
            continue
        node_id = str(id_counter)
        id_counter += 1

        # Find parent based on indentation
        while stack and stack[-1][1] >= indent:
            stack.pop()
        parent_id = stack[-1][0] if stack else None

        nodes.append({
            "id": node_id,
            "text": clean_text,
            "parent": parent_id
        })
        stack.append((node_id, indent))

    if nodes:
        return {"nodes": nodes}
    return None
