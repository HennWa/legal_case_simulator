from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.create_case import router as create_case_router
from backend.api.node import router as node_router
from backend.api.cases import router as cases_router
from backend.api.graph import router as graph_router
from backend.api.add_node_by_action import router as add_node_by_action_router
from backend.api.add_node import router as add_node_router
from backend.api.delete_node import router as delete_node_router
from backend.api.legal_check import router as legal_check
from backend.database.init_db import create_indexes


create_indexes()  # any time called, recognized by Mongo DB

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
                   "http://localhost:5173",
                   "http://localhost:5174",
                   "http://127.0.0.1:5173"],  # adjust to your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph_router, prefix="/api")
app.include_router(node_router, prefix="/api")
app.include_router(cases_router, prefix="/api")
app.include_router(add_node_router, prefix="/api")
app.include_router(add_node_by_action_router, prefix="/api")
app.include_router(delete_node_router, prefix="/api")
app.include_router(legal_check, prefix="/api")
app.include_router(create_case_router, prefix="/api")

