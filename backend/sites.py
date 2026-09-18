
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from dependencies import get_current_user
from models import Project, Site
from site_schemas import SiteCreate, SiteResponse


router = APIRouter(prefix="/sites", tags=["Sites"])


@router.post("/", response_model=SiteResponse, status_code=201)
def create_site(
    site_data: SiteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    project = (
        db.query(Project)
        .filter(
            Project.id == site_data.project_id,
            Project.owner_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    boundary_json = json.dumps(site_data.boundary)

    new_site = Site(
        name=site_data.name,
        project_id=site_data.project_id,
        boundary=func.ST_SetSRID(
            func.ST_GeomFromGeoJSON(boundary_json),
            4326,
        ),
    )

    db.add(new_site)
    db.commit()
    db.refresh(new_site)

    return new_site



@router.get("/project/{project_id}", response_model=list[SiteResponse])
def get_project_sites(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    sites = (
        db.query(
            Site.id,
            Site.name,
            Site.project_id,
            func.ST_AsGeoJSON(Site.boundary).label("boundary"),
        )
        .filter(Site.project_id == project_id)
        .all()
    )

    return [
        {
            "id": site.id,
            "name": site.name,
            "project_id": site.project_id,
            "boundary": json.loads(site.boundary) if site.boundary else None,
        }
        for site in sites
    ]