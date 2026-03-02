from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router import execute, tests

CORS_ORIGINS = ["*"]
CORS_METHODS = ["*"]
CORS_HEADERS = ["*"]

app = FastAPI(title="Juez de Código", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=CORS_METHODS,
    allow_headers=CORS_HEADERS,
)

app.include_router(execute.router)
app.include_router(tests.router)

@app.get("/")
def read_root():
    return {"mensaje": "HOLA!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}