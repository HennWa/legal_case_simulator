# Legal Case Simulator

## Goal
Building an AI system that simulates legal reasoning 
using German law (BGB, AO, etc.), combining graph-based reasoning + LLM agents.

## Core Idea
Cases are represented as a graph of legal reasoning steps (LegalBranchNodes),
which are processed and expanded by AI agents. Nodes are legal states and edges
are legal actions. Each state can be extend by new actions and states with
legal checks.

## Tech Stack
- Python (FastAPI backend) (python 3.11)
- Openai Interface for connecting to llm's
- React (frontend graph UI) + React Flow (graph representation)
- Chroma Vector DB (law ingestion, embeddings)

## Core Components

### 1. Graph Engine
- Graph engine and class types are given in file graph_classes.py
- The graph contains all functionality of graph modifications adding nodes etc.

### 2. Agent System
- Currently one llm interface class MockLLMProvider that 
provides a generate function which returns a LegalBranchNode obj.
This function is used with different prompts to crate new nodes or
check for legal compliance of nodes.
- Prompts are created by a prompt engine called PromptBuilder. Prompts
can be created to create new nodes or for legal check of nodes.
The prompts are dynamically created incorporating relevant information 
the graph.
- Legal information is retrieved from a chroma vector db by cosine 
similarity search and then used in prompts.
- There are no real agents that communicate to each other. The system is
simply based on llm calls with dynamic prompts.

### 3. Data Layer
- The graph is currently locally stored in file graph.json
- The knowledge database is currently locally stored as a chrome vector db. 
Currently it contains some example law book like BGB

### 4. Frontend
- React app in file App.jsx
- Graph visualization (React Flow)
- Node editing + simulation

## Current Phase
MVP: 
-basic graph 
-node expansion / deletion (api calls, manual agent calls) 
-legal check (chroma similarity search for legal information retrieval)

## Next steps
- expansion of legal info db, graph based storage 
- production UI
- multi-user system
- authentication