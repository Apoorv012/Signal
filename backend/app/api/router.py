from fastapi import APIRouter

from app.api.routes import auth, conversations, devices, messages, security, users

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(conversations.router)
api_router.include_router(messages.router)
api_router.include_router(devices.router)
api_router.include_router(security.router)
