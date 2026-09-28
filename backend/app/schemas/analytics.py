from datetime import datetime
from pydantic import BaseModel


class ClicksOverTimePoint(BaseModel):
    date: datetime
    count: int


class NamedCount(BaseModel):
    name: str
    count: int


class URLAnalyticsResponse(BaseModel):
    total_clicks: int
    unique_visitors: int
    clicks_today: int
    clicks_over_time: list[ClicksOverTimePoint]
    top_countries: list[NamedCount]
    top_cities: list[NamedCount]
    top_referrers: list[NamedCount]
    browsers: list[NamedCount]
    operating_systems: list[NamedCount]
    devices: list[NamedCount]
