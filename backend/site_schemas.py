
from pydantic import BaseModel, Field


class SiteCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    project_id: int
    boundary: dict


class SiteResponse(BaseModel):
    id: int
    name: str
    project_id: int
    boundary: dict | None = None

    model_config = {"from_attributes": True}