from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List
import json, os, traceback

from core.config import gemini
from schemas.node import TranscriptChunk, MindMapNode, MapPayload, MapResponse
from llm.tools import extract_structure

app = FastAPI()

# CORS — allow your React app on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate-map", response_model=MapResponse)
async def generate_map(request: Request, payload: MapPayload):
    """Generate a mind map from transcript chunks, with debug error output."""
    try:
        nodes_data = extract_structure(payload.chunks)
        # Convert id and parent to strings for Pydantic
        for node in nodes_data:
            node["id"] = str(node["id"])
            if node.get("parent") is not None:
                node["parent"] = str(node["parent"])
        nodes = [MindMapNode(**node) for node in nodes_data]
        return MapResponse(nodes=nodes)
    except Exception as e:
        tb = traceback.format_exc()
        print(tb)
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "trace": tb}
        )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "MindStream API is running"}