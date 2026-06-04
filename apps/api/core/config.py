from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALLOWED_DOMAINS: str = "polytechnique.edu,telecom-paris.fr"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    @property
    def allowed_domains_list(self) -> List[str]:
        return [d.strip() for d in self.ALLOWED_DOMAINS.split(",") if d.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
