from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List
import json, os, traceback

from core.config import gemini
from models import TranscriptChunk, MindMapNode, MapPayload, MapResponse

app = FastAPI()

# CORS — allow your React app on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_mind_map_structure(transcript_chunks: List[TranscriptChunk]) -> List[MindMapNode]:
    """Call Gemini to turn transcript chunks into a JSON mind-map, stripping code fences if present."""
    full_text = " ".join(chunk.text for chunk in transcript_chunks)
    safe_text = json.dumps(full_text)
    example = json.dumps([
        {"id": "1", "text": "Main Topic", "parent": None, "position": {"x": 0, "y": 0}}
    ])

    prompt = f"""
Analyze the following transcript and create a hierarchical mind map structure.
Extract key topics, ideas, and their relationships.

Transcript: {safe_text}

Return ONLY a JSON array of nodes with this exact format:
{example}

Rules:
- Use hierarchical structure (parent-child relationships)
- Assign unique IDs (1, 2, 3, etc.)
- Set parent to null for root nodes
- Include position coordinates for visualization
- Keep text concise and meaningful
- Extract 5-15 key nodes total
"""

    model_name = os.getenv("GEMINI_MODEL", "models/gemini-1.5-flash-latest")
    print(f"Using Gemini model: {model_name}")

    model = gemini.GenerativeModel(model_name)
    response = model.generate_content(prompt)

    raw = response.text or ""
    print("💬 RAW LLM RESPONSE:", raw)

    # Strip markdown code fence if present
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        # Drop opening fence
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        # Drop closing fence
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    text = text.strip()

    if not text:
        raise ValueError("LLM returned empty response after stripping fences")

    # Attempt to parse JSON
    nodes_data = json.loads(text)

    return [
        MindMapNode(
            id=node["id"],
            text=node["text"],
            parent=node.get("parent"),
            position=node.get("position"),
            importance=node.get("importance", 1),
            node_type=node.get("node_type", "default"),
        )
        for node in nodes_data
    ]

@app.post("/generate-map", response_model=MapResponse)
async def generate_map(request: Request, payload: MapPayload):
    """Generate a mind map from transcript chunks, with debug error output."""
    try:
        nodes = extract_mind_map_structure(payload.chunks)
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