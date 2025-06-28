# data/transcript_buffer.py

class TranscriptBuffer:
    def __init__(self, max_chunks: int = 100):
        self.chunks = []
        self.prior_map = []
        self.max_chunks = max_chunks

    def add(self, new_chunks):
        self.chunks.extend(new_chunks)
        # keep only most recent
        self.chunks = self.chunks[-self.max_chunks:]

    def get_recent(self):
        return self.chunks

    def update_map(self, new_map):
        self.prior_map = new_map

    def get_map(self):
        return self.prior_map 