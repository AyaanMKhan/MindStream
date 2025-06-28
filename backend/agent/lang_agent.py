# agent/lang_agent.py

import os
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()

# Set API key and initialize REST client
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise RuntimeError("GOOGLE_API_KEY environment variable is not set!")
os.environ["GENAI_API_KEY"] = api_key
genai.configure(api_key=api_key)

from langchain.agents import initialize_agent, AgentType
from langchain_google_genai import ChatGoogleGenerativeAI
from agent.tool_registry import langchain_tools

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash-latest",
    temperature=0.2,
    use_rest_api=True  # or client_type="rest" if your version requires
)

agent_executor = initialize_agent(
    langchain_tools,
    llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
)
