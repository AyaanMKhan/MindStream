from pydantic import BaseModel
from typing import List

class Chunk(BaseModel):
    start: float
    end: float
    text: str

class MindMap(BaseModel):
    chunks: List[Chunk]
