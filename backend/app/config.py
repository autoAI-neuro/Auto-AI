from pydantic import BaseSettings


class Settings(BaseSettings):
DATABASE_URL: str
META_VERIFY_TOKEN: str
META_APP_ID: str
META_APP_SECRET: str
WHATSAPP_BUSINESS_ID: str
WHATSAPP_PHONE_NUMBER_ID: str
WHATSAPP_ACCESS_TOKEN: str


OPENAI_API_KEY: str | None = None
VOICE_PROVIDER: str | None = None
VOICE_API_KEY: str | None = None
VOICE_SPEAKER_ID: str | None = None


STORAGE_BACKEND: str = "s3"
AWS_ACCESS_KEY_ID: str | None = None
AWS_SECRET_ACCESS_KEY: str | None = None
AWS_S3_BUCKET: str | None = None
AWS_REGION: str | None = None


GOOGLE_CREDENTIALS_JSON_PATH: str | None = None


JWT_SECRET: str
JWT_EXPIRE_MINUTES: int = 43200
WEBHOOK_SIGNATURE_SECRET: str


APP_ENV: str = "dev"
BASE_URL: str = "http://localhost:8000"
APP_VERSION: str = "2.0.0"


class Config:
env_file = ".env"


settings = Settings()