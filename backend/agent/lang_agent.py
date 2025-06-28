# agent/lang_agent.py

from langchain.agents import initialize_agent, AgentType
from langchain_google_genai import ChatGoogleGenerativeAI
from agent.tool_registry import langchain_tools

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", temperature=0.2)

agent_executor = initialize_agent(
    tools=langchain_tools,
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)
