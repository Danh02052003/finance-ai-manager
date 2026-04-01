from pymongo import MongoClient
from pymongo.database import Database

from app.config.settings import Settings


class MongoConnectionManager:
    def __init__(self) -> None:
        self.client: MongoClient | None = None
        self.database: Database | None = None

    def connect(self, settings: Settings) -> None:
        if not settings.mongodb_uri:
            return

        self.client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        self.database = self.client[settings.mongodb_db_name]

    def close(self) -> None:
        if self.client is not None:
            self.client.close()
            self.client = None
            self.database = None


mongo_manager = MongoConnectionManager()
