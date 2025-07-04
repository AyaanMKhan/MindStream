from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import traceback
import os
import assemblyai as aai
import re
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from agent.controller import MindMapAgent
from schemas.node import TranscriptChunk, MindMapNode, MapPayload, MapResponse

from utils import db
from schemas import model
from bson import ObjectId
from fastapi.staticfiles import StaticFiles
from fastapi import Body
from llm.tools import extract_structure, merge_maps, get_memory, set_memory
from agent.agent_mcp import MindMapAgentMCP
from mcp.memory import agent_memory

# Import config to configure Google API key
import core.config

app = FastAPI()
app.mount("/mcp", StaticFiles(directory="mcp"), name="mcp")

col_mindmap, col_gallery, col_transcripts = None, None, None

# Configure AssemblyAI
aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")

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
    global col_mindmap, col_gallery, col_transcripts
    
    # Validate AssemblyAI API key
    assemblyai_key = os.getenv("ASSEMBLYAI_API_KEY")
    if not assemblyai_key:
        print("⚠️  Warning: ASSEMBLYAI_API_KEY not set. Audio transcription will not work.")
    else:
        print("✅ AssemblyAI API key configured")
    
    await db.connect_db()
    if db.database is None:
        raise RuntimeError("❌ MongoDB failed to initialize on startup.")
    
    col_mindmap = db.database.mindmaps
    col_gallery = db.database.gallery
    col_transcripts = db.database.transcripts
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

        result = agent.run(transcript_text, previous_map, session_id)
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

@app.post("/api/save-mindmap")
async def save_mindmap(mindmap: model.MindMap):
    doc = mindmap.dict()
    doc["created_at"] = datetime.utcnow()
    result = col_mindmap.insert_one(doc)
    return {"status": "success", "inserted_id": str(result.inserted_id)}

@app.get("/api/mindmap")
def get_all_mindmaps():
    try:
        mindmaps = list(col_mindmap.find({}, {"_id": 1, "title": 1}))
        for m in mindmaps:
            m["_id"] = str(m["_id"])
        return mindmaps
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/gallery")
def get_all_gallery_maps():
    try:
        gallery_maps = list(col_gallery.find({}, {"_id": 1, "title": 1}))
        for m in gallery_maps:
            m["_id"] = str(m["_id"])
        return gallery_maps
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract")
def extract_structure_api(payload: MapPayload):
    return extract_structure(payload.chunks)

@app.post("/merge")
def merge_maps_api(payload: dict):
    existing = payload.get("existing", {})
    new_nodes = payload.get("new_nodes", [])
    return merge_maps(existing, new_nodes)

# AssemblyAI Audio Processing Endpoints
@app.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    """
    Upload audio file and start AssemblyAI transcription
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Generate unique ID for this transcription
        transcript_id = str(uuid.uuid4())
        
        # Save file temporarily
        temp_path = f"/tmp/{transcript_id}_{file.filename}"
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Start AssemblyAI transcription
        config = aai.TranscriptionConfig(
            speaker_labels=True,
            auto_chapters=True,
            entity_detection=False
        )
        
        transcript = aai.Transcriber().transcribe(temp_path, config)
        
        if transcript.status == aai.TranscriptStatus.error:
            raise HTTPException(status_code=500, detail=f"Transcription failed: {transcript.error}")
        
        # Convert to our JSON format
        chunks = []
        for utterance in transcript.utterances:
            chunks.append({
                "start": utterance.start,
                "end": utterance.end,
                "text": utterance.text,
                "speaker": utterance.speaker
            })
        
        # Store in database
        transcript_data = {
            "_id": ObjectId(),
            "transcript_id": transcript_id,
            "filename": file.filename,
            "chunks": chunks,
            "raw_transcript": transcript.json,
            "created_at": datetime.utcnow(),
            "status": "completed"
        }
        
        col_transcripts.insert_one(transcript_data)
        
        # Clean up temp file
        os.remove(temp_path)
        
        return {
            "transcript_id": transcript_id,
            "status": "completed",
            "chunks": chunks,
            "message": "Audio transcribed successfully"
        }
        
    except Exception as e:
        tb = traceback.format_exc()
        print(f"=== ERROR IN /upload-audio ===")
        print(tb)
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "trace": tb}
        )

@app.get("/transcript/{transcript_id}")
async def get_transcript(transcript_id: str):
    """
    Get stored transcript by ID
    """
    try:
        transcript = col_transcripts.find_one({"transcript_id": transcript_id})
        if not transcript:
            raise HTTPException(status_code=404, detail="Transcript not found")
        
        transcript["_id"] = str(transcript["_id"])
        return transcript
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.post("/generate-map-from-transcript/{transcript_id}")
async def generate_map_from_transcript(transcript_id: str, payload: dict):
    """
    Generate mind map from stored transcript
    """
    try:
        # Get transcript from database
        transcript = col_transcripts.find_one({"transcript_id": transcript_id})
        if not transcript:
            raise HTTPException(status_code=404, detail="Transcript not found")
        
        # Use the stored chunks
        chunks = transcript["chunks"]
        
        # Create MapPayload
        map_payload = MapPayload(
            session_id=payload.get("session_id", str(uuid.uuid4())),
            chunks=[TranscriptChunk(**chunk) for chunk in chunks]
        )
        
        # Use existing mind map generation logic
        agent = MindMapAgent()
        agent.ingest_chunks(map_payload.chunks)
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
        print("=== ERROR IN /generate-map-from-transcript ===")
        print(tb)
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "trace": tb}
        )

@app.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribe audio file using AssemblyAI
    """
    try:
        # Check if AssemblyAI API key is configured
        if not os.getenv("ASSEMBLYAI_API_KEY"):
            raise HTTPException(
                status_code=500, 
                detail="AssemblyAI API key not configured. Please set ASSEMBLYAI_API_KEY environment variable."
            )
        
        if not audio.filename:
            raise HTTPException(status_code=400, detail="No audio file provided")
        
        # Generate unique ID for this transcription
        transcript_id = str(uuid.uuid4())
        
        # Save file temporarily
        temp_path = f"/tmp/{transcript_id}_{audio.filename}"
        with open(temp_path, "wb") as buffer:
            content = await audio.read()
            buffer.write(content)
        
        print(f"🎤 Processing audio file: {temp_path}")
        
        # Start AssemblyAI transcription
        try:
            config = aai.TranscriptionConfig(
                speaker_labels=True,
                auto_chapters=True,
                entity_detection=False
            )
            
            transcript = aai.Transcriber().transcribe(temp_path, config)
            
            if transcript.status == aai.TranscriptStatus.error:
                error_details = f"Transcription failed: {transcript.error}"
                print(f"🔴 AssemblyAI Error: {error_details}")
                print(f"🔴 Transcript ID: {transcript.id}")
                print(f"🔴 Status: {transcript.status}")
                # Clean up temp file before raising error
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                raise HTTPException(status_code=500, detail=error_details)
                
        except Exception as transcription_error:
            print(f"🔴 AssemblyAI Transcription Exception: {transcription_error}")
            print(f"🔴 Error type: {type(transcription_error)}")
            # Clean up temp file before raising error
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(status_code=500, detail=f"Transcription service error: {str(transcription_error)}")
        
        print(f"✅ Transcription completed for {transcript_id}")
        
        # Convert to our JSON format
        chunks = []
        for utterance in transcript.utterances:
            chunks.append({
                "start": utterance.start,
                "end": utterance.end,
                "text": utterance.text,
                "speaker": utterance.speaker
            })
        
        # Manually convert transcript object to dictionary
        raw_transcript_dict = {
            "id": transcript.id,
            "status": transcript.status,
            "audio_url": transcript.audio_url,
            "text": transcript.text,
            "confidence": transcript.confidence,
            "audio_duration": transcript.audio_duration,
            "utterances": [
                {
                    "start": u.start,
                    "end": u.end,
                    "text": u.text,
                    "speaker": u.speaker,
                    "confidence": u.confidence
                } for u in transcript.utterances
            ] if transcript.utterances else [],
            "chapters": [
                {
                    "start": c.start,
                    "end": c.end,
                    "headline": c.headline,
                    "summary": c.summary,
                    "gist": c.gist
                } for c in transcript.chapters
            ] if transcript.chapters else [],
            "entities": []  # Disabled entity detection, so always empty
        }
        
        # Store in database
        transcript_data = {
            "_id": ObjectId(),
            "transcript_id": transcript_id,
            "filename": audio.filename,
            "chunks": chunks,
            "raw_transcript": raw_transcript_dict,
            "created_at": datetime.utcnow(),
            "status": "completed"
        }
        
        col_transcripts.insert_one(transcript_data)
        
        # Clean up temp file
        os.remove(temp_path)
        
        # Return the format expected by the frontend
        return {
            "transcript_id": transcript_id,
            "status": "completed",
            "chunks": chunks,
            "message": "Audio transcribed successfully",
            "text": " ".join([chunk["text"] for chunk in chunks])  # Full text for display
        }
        
    except Exception as e:
        tb = traceback.format_exc()
        print(f"=== ERROR IN /transcribe ===")
        print(tb)
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "trace": tb}
        )

# MCP Memory Management Endpoints
@app.post("/get-memory")
async def get_memory_api(payload: dict):
    """
    Get memory for a session (MCP tool endpoint)
    """
    try:
        session_id = payload.get("session_id")
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")
        
        result = get_memory(session_id)
        return result
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.post("/set-memory")
async def set_memory_api(payload: dict):
    """
    Set memory for a session (MCP tool endpoint)
    """
    try:
        session_id = payload.get("session_id")
        memory_data = payload.get("memory_data", {})
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")
        
        result = set_memory(session_id, memory_data)
        return result
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

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

