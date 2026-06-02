from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.node import router as node_router
from api.cases import router as cases_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(node_router, prefix="/api")
app.include_router(cases_router, prefix="/api")

