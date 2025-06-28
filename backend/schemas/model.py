from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
class Chunk(BaseModel):
    start: float
    end: float
    text: str

class MindMapText(BaseModel):
    chunks: List[Chunk]

class Node(BaseModel):
    id: str
    type: str
    data: dict
    position: dict

class Edge(BaseModel):
    id: str
    source: str
    target: str
    type: strAC
    animated: Optional[bool] = False
    style: Optional[dict] = {}

class MindMap(BaseModel):
    title: str
    modeUsed: str
    nodes: List[Node]
    edges: List[Edge]
    timestamp: Optional[str] = None