from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Metric, Project, Site
from metric_schemas import MetricCreate, MetricResponse


router = APIRouter(prefix="/metrics", tags=["Metrics"])


def get_owned_site(site_id: int, db: Session, user_id: int):
    site = (
        db.query(Site)
        .join(Project, Site.project_id == Project.id)
        .filter(
            Site.id == site_id,
            Project.owner_id == user_id,
        )
        .first()
    )

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Site not found",
        )

    return site


@router.post("/", response_model=MetricResponse, status_code=201)
def create_metric(
    metric_data: MetricCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_owned_site(
        metric_data.site_id,
        db,
        current_user.id,
    )

    new_metric = Metric(
        site_id=metric_data.site_id,
        metric_type=metric_data.metric_type,
        value=metric_data.value,
        unit=metric_data.unit,
    )

    db.add(new_metric)
    db.commit()
    db.refresh(new_metric)

    return new_metric


@router.get(
    "/site/{site_id}",
    response_model=list[MetricResponse],
)
def get_site_metrics(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_owned_site(site_id, db, current_user.id)

    return (
        db.query(Metric)
        .filter(Metric.site_id == site_id)
        .order_by(Metric.recorded_at.desc())
        .all()
    )