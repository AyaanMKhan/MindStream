from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback

from agent.controller import MindMapAgent
from schemas.node import TranscriptChunk, MindMapNode, MapPayload, MapResponse

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
async def generate_map(payload: MapPayload):
    """
    Fast, deterministic mode — uses hardcoded extract + merge tools.
    """
    try:
        agent = MindMapAgent()
        agent.ingest_chunks(payload.chunks)
        nodes_data = agent.run()

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
        user_query = f"Generate a mind map from this transcript:\n{transcript_text}"

        result = agent.run_langchain_agent(user_query)
        return {"result": result}

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
        return {"result": agent.run_langchain_agent(...) }
    except:
        return {"nodes": agent.run()}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "MindStream API is running"}
