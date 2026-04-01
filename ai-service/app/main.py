from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config.db import mongo_manager
from app.config.settings import get_settings
from app.routes.assistant_ai import router as assistant_ai_router
from app.routes.health import router as health_router
from app.routes.import_ai import router as import_ai_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    mongo_manager.connect(settings)
    app.state.settings = settings
    app.state.mongo = mongo_manager.database
    yield
    mongo_manager.close()


app = FastAPI(
    title="Finance AI Manager AI Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(assistant_ai_router)
app.include_router(health_router)
app.include_router(import_ai_router)
