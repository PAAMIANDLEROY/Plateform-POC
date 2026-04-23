from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from core.config import settings


async def init_db() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db_name = settings.MONGODB_URL.rsplit("/", 1)[-1].split("?")[0]

    from models.user import User
    from models.allowed_domain import AllowedDomain

    await init_beanie(database=client[db_name], document_models=[User, AllowedDomain])
