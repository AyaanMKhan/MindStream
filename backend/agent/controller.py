from data.transcript_buffer import TranscriptBuffer
from agent.tool_registry import TOOL_REGISTRY
from agent.lang_agent import agent_executor

class MindMapAgent:
    def __init__(self, model_name="models/gemini-2.5-pro"):
        self.buffer = TranscriptBuffer()
        self.model_name = model_name

    def ingest_chunks(self, chunks):
        self.buffer.add(chunks)

    def run(self):
        chunks = self.buffer.get_recent()
        prior_map = self.buffer.get_map()

        extract_tool = TOOL_REGISTRY["extract"]
        merge_tool = TOOL_REGISTRY["merge"]

        # extract_structure(chunks, model_name)
        new_nodes = extract_tool.run(chunks, self.model_name)

        # merge_maps(existing, new_nodes, model_name)
        merged = merge_tool.run(prior_map, new_nodes, self.model_name)

        self.buffer.update_map(merged)
        return merged
    
    def run_langchain_agent(self, user_query: str):
        return agent_executor.run(user_query)
