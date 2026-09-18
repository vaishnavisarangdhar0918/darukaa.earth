from datetime import datetime

from pydantic import BaseModel, Field


class MetricCreate(BaseModel):
    site_id: int
    metric_type: str = Field(
        min_length=2,
        max_length=50,
    )
    value: float
    unit: str = Field(
        min_length=1,
        max_length=30,
    )


class MetricResponse(BaseModel):
    id: int
    site_id: int
    metric_type: str
    value: float
    unit: str
    recorded_at: datetime

    model_config = {"from_attributes": True}