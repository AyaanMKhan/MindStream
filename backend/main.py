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
from fastapi.staticfiles import StaticFiles
from fastapi import Body
from llm.tools import extract_structure, merge_maps
from agent.agent_mcp import MindMapAgentMCP
from mcp.memory import agent_memory

# Import config to configure Google API key
import core.config

app = FastAPI()
app.mount("/mcp", StaticFiles(directory="mcp"), name="mcp")

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
    print(col_mindmap)


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
    Smart mode — uses Gemini MCP agent to dynamically choose tools, with agentic memory.
    """
    try:
        session_id = payload.session_id
        agent = MindMapAgentMCP()
        chunks = [chunk.dict() if hasattr(chunk, 'dict') else chunk for chunk in payload.chunks]
        transcript_text = " ".join(chunk["text"] for chunk in chunks)
        previous_map = agent_memory.get(session_id, {})

        result = agent.run(transcript_text, previous_map)
        print(f"🔍 MCP Agent result type: {type(result)}, value: {result}")
        
        # Handle dict result (from tool execution)
        if isinstance(result, dict):
            if 'nodes' in result and isinstance(result['nodes'], list):
                nodes = result['nodes']
                agent_memory[session_id] = {"nodes": nodes}
                return {"result": nodes}
            elif 'error' in result:
                return JSONResponse(
                    status_code=500,
                    content={"error": result['error']}
                )
            else:
                print(f"⚠️ Unexpected dict result: {result}")
        
        # Handle text result (from fallback)
        elif isinstance(result, str):
            # Try to extract JSON from the result
            try:
                match = re.search(r'\{[^{}]*nodes[^{}]*\[[^\]]*\][^{}]*\}', result, re.DOTALL)
                if not match:
                    match = re.search(r'\{[^{}]*\}', result, re.DOTALL)
                if match:
                    json_str = match.group(0)
                    json_str = (
                        json_str.replace("'", '"')
                                .replace('None', 'null')
                                .replace('True', 'true')
                                .replace('False', 'false')
                    )
                    parsed_data = json.loads(json_str)
                    if 'nodes' in parsed_data and isinstance(parsed_data['nodes'], list):
                        nodes = parsed_data['nodes']
                        agent_memory[session_id] = {"nodes": nodes}
                        return {"result": nodes}
            except Exception as parse_error:
                print(f"Error parsing MCP result: {parse_error}")
            
            # Fallback: try to parse as outline
            nodes_json = try_parse_outline(result)
            if nodes_json:
                agent_memory[session_id] = nodes_json
                return {"result": nodes_json["nodes"]}
        
        # If we get here, we couldn't parse the result
        return JSONResponse(
            status_code=500,
            content={"error": "AI did not return a valid mind map. Please try again or rephrase your input."}
        )
    except Exception as e:
        tb = traceback.format_exc()
        print("=== ERROR IN /generate-map/langchain (MCP) ===")
        print(tb)
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "trace": tb}
        )

@app.post("/api/mindmap")
def insert_mindmap(mindmap: model.MindMap):
    mindmapDict = mindmap.dict()
    result = col_mindmap.insert_one(mindmapDict)
    return {"inserted_id": str(result.inserted_id)}

@app.get("/api/mindmap/{id}")
def get_mindmap(id: str):
    try:
        result = col_mindmap.find_one({"_id": ObjectId(id)})
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

@app.post("/extract")
def extract_structure_api(payload: MapPayload):
    return extract_structure(payload.chunks)

@app.post("/merge")
def merge_maps_api(payload: dict):
    existing = payload.get("existing", {})
    new_nodes = payload.get("new_nodes", [])
    return merge_maps(existing, new_nodes)

