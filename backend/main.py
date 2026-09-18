from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from metrics import router as metrics_router
from auth import router as auth_router
from projects import router as projects_router
from sites import router as sites_router

app = FastAPI(
    title="Darukaa.Earth API",
    description="Environmental Project Management Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)

app.include_router(auth_router)
app.include_router(sites_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to Darukaa.Earth!",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}