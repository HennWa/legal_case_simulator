User (React UI)
      ↓
FastAPI Backend
      ↓
Business Layer (expansion engine, legal services)
      ↓
Prompt Builder
      ↓
Graph Engine + Vector DB (BGB / AO embeddings)
      ↓
LLM Interface (Openai interfqce)


DB Architecture:
CaseGraph
    |
    | save/load
    v
GraphRepository
    |
    +--> CaseRepository
    +--> NodeRepository
    +--> EdgeRepository
    +--> ActorRepository
    |
MongoDB
      
