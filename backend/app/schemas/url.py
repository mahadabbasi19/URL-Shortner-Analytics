import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

_ALIAS_PATTERN = re.compile(r"^[A-Za-z0-9_-]{3,50}$")
_ALLOWED_SCHEMES = {"http", "https"}


class URLCreate(BaseModel):
    original_url: str = Field(..., min_length=1, max_length=8192)
    custom_alias: str | None = Field(default=None)
    expires_at: datetime | None = Field(default=None)
    title: str | None = Field(default=None, max_length=255)

    @field_validator("original_url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        value = value.strip()
        match = re.match(r"^([a-zA-Z][a-zA-Z0-9+.-]*):", value)
        if not match or match.group(1).lower() not in _ALLOWED_SCHEMES:
            raise ValueError("original_url must start with http:// or https://")
        if len(value) < 11:  # shortest possible: "http://a.b"
            raise ValueError("original_url is too short to be valid")
        return value

    @field_validator("custom_alias")
    @classmethod
    def validate_alias(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not _ALIAS_PATTERN.match(value):
            raise ValueError(
                "custom_alias must be 3-50 characters: letters, digits, hyphen, underscore"
            )
        return value


class URLUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    expires_at: datetime | None = None
    is_active: bool | None = None


class URLResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    original_url: str
    short_code: str
    custom_alias: str | None
    title: str | None
    created_at: datetime
    updated_at: datetime
    expires_at: datetime | None
    is_active: bool
    total_clicks: int


class URLCreateResponse(URLResponse):
    short_url: str
