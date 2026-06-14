from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.node import router as node_router
from api.cases import router as cases_router
from api.graph import router as graph_router
from api.add_node import router as add_node_router
from api.delete_node import router as delete_node_router
from api.legal_check import router as legal_check

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # adjust to your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph_router, prefix="/api")
app.include_router(node_router, prefix="/api")
app.include_router(cases_router, prefix="/api")
app.include_router(add_node_router, prefix="/api")
app.include_router(delete_node_router, prefix="/api")
app.include_router(legal_check, prefix="/api")

