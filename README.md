# 🧠 MindStream: Accessible Mind Maps from Meetings — Powered by Agentic AI

> Built at GemiHacks 2025 | Uses Gemini 1.5 + Model Component Protocol (MCP)

---

## 🎯 Elevator Pitch

**Turn messy meeting transcripts into clean, visual mind maps — powered by agentic AI.**  
Designed to help neurodivergent users, people with ADHD, and those who are hard of hearing quickly absorb what matters.

---

## 💡 Why We Built This

Meetings can be overwhelming, especially for:
- 🧠 People with ADHD or cognitive disabilities
- 🧏 Individuals who are hard of hearing and rely on transcripts
- 🔁 Anyone who has trouble keeping track of follow-ups and structure

Traditional transcripts are long, flat, and inaccessible. Static summaries lose key structure. We wanted to fix that — using generative AI to transform transcripts into **visual, hierarchical mind maps** that are easy to follow and act on.

---

## 🧠 How It Works

MindStream takes a transcript (from meetings, interviews, lectures, etc.) and converts it into a structured mind map using two modes:

### ✅ Classic Mode (LLM-only)
- One-shot prompt to Gemini 1.5 Flash
- Transcript is sent as input
- Output is parsed as a JSON mind map

### 🧠 Agentic Mode (MCP-Powered)
Gemini becomes an agent with tools it can call during its reasoning:

| Tool Name         | What It Does                                           |
|-------------------|--------------------------------------------------------|
| `extract_structure` | Extracts mind map nodes from transcript chunks         |
| `merge_maps`        | Merges new nodes into the current map structure        |
| `agent_memory` (optional) | Recalls past user sessions to evolve the map          |

Gemini uses these tools **autonomously** as it reasons, chunk-by-chunk, building better structured, deeper maps for long or complex transcripts.

---

## 👩‍💻 Tech Stack

### ✨ AI Layer
- **Gemini 1.5 Flash** (`google.generativeai`)
- **Model Component Protocol (MCP)** for native tool-calling
- JSON-based schema endpoints for tools

### 💻 Frontend
- React + TypeScript + TailwindCSS
- React Flow for dynamic mind map rendering

### ⚙️ Backend
- FastAPI (Python)
- MongoDB Atlas for persistence
- MCP tool schema serving via FastAPI routes
- Optional LangChain fallback agent

---

## 🔍 Key Features

- 🔁 **Dual mode**: Classic prompt or advanced agentic reasoning
- 🧩 **Tool-callable Gemini agent** (extract, merge, memory)
- 🧠 **Neuroinclusive UI**: Visual mind maps instead of flat transcripts
- 💾 **Optional memory**: Persist and evolve maps across sessions
- 📚 **Robust fallback parsing** for malformed or unexpected outputs

---

## 📈 Demo Use Case

> You upload a 30-minute transcript of a product strategy meeting.  
> Gemini breaks it down, extracts branches like "Launch Plan", "Frontend Tasks", "Backend Issues", "Post-Launch Priorities", and maps relationships like a visual outline.

This is especially helpful for:
- Reviewing meetings faster
- Identifying action items at a glance
- Supporting users with cognitive accessibility needs

---

## 🧪 What We Learned

- How to expose real backend tools to an LLM using MCP
- Building resilient parsing logic for LLM output
- Prompt engineering for autonomous tool use
- Designing for neurodiversity and accessibility from day one

---

## 🚧 Challenges

- Parsing malformed or overly verbose LLM responses
- MCP tool schema formatting (naming, inputs, types)
- Managing Gemini’s reasoning state in multi-step tasks
- Timeboxing agent responses to reduce cost and latency

---

## 💡 What’s Next

- 🔊 **Voice → transcript → mind map** pipeline
- 🧠 **Persistent vector memory** for smarter long-term agents
- 🧩 Editable mind maps with LLM-guided refinement
- 📤 Export mind maps to Notion, PDF, or task systems

---

## 👏 Team + Credit

- 💻 Sujan Katari (Agent design, frontend, backend, MCP integration)
- ⚙️ Gemini 1.5 (Google Generative AI)
- 📚 Powered by MCP and inspiration from LangChain & LangGraph agent systems

---

## 🏁 Final Thoughts

MindStream doesn’t just summarize — it **understands**, **organizes**, and **visualizes** complex conversations. By turning transcripts into mind maps, it makes meetings more accessible, actionable, and inclusive for everyone.

> ✨ Built with purpose, powered by agents.
