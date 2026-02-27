from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    FRONTEND_URL: str
    
    # WizeChat Integration (Optional for local dev, usually overridden per-tenant)
    WIZECHAT_API_URL: str | None = None
    WIZECHAT_API_KEY: str | None = None
    
    APP_NAME: str = "WizeSign"
    APP_ENV: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
