from typing import Optional, Dict, List
from pydantic import BaseModel

class GeminiPayload(BaseModel):
    prompt: str
    model: str = "gemini-pro"
    temperature: float = 0.2
    max_tokens: int = 512

class GeminiResponse(BaseModel):
    text: str

class TranscriptChunk(BaseModel):
    start: float
    end:   float
    text:  str

class MindMapNode(BaseModel):
    id:         str
    text:       str
    parent:     Optional[str] = None

class MapPayload(BaseModel):
    session_id: str
    chunks: List[TranscriptChunk]

class MapResponse(BaseModel):
    nodes: List[MindMapNode] 