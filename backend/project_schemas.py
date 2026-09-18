from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None
    owner_id: int

    model_config = {"from_attributes": True}