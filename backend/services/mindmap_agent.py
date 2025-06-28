import json
from google.generativeai import TextCompletion
from .prompts import EXTRACT_PROMPT, MERGE_PROMPT


def extract_structure(chunks):
    transcript_json = json.dumps([c.dict() for c in chunks])
    prompt = EXTRACT_PROMPT.format(transcript=transcript_json)
    resp = TextCompletion.create(model="gemini-pro", prompt=prompt, temperature=0.2)
    return json.loads(resp.choices[0].text)


def merge_maps(existing, new_nodes):
    prompt = MERGE_PROMPT.format(
        existing=json.dumps(existing),
        new=json.dumps(new_nodes)
    )
    resp = TextCompletion.create(model="gemini-pro", prompt=prompt, temperature=0.2)
    return json.loads(resp.choices[0].text)