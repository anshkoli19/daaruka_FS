from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from shapely.geometry import shape

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import Project, Site
from app.schemas import ProjectCreate, ProjectOut, SiteCreate, SiteOut

router = APIRouter(prefix="/projects", tags=["projects"])


def _approx_area_hectares(geojson_geometry) -> float:
    """Rough planar area estimate for demo purposes.
    Production version should use PostGIS ST_Area on a geography column
    for accurate geodesic measurement."""
    try:
        geom = shape(geojson_geometry)
        # crude deg^2 -> hectares conversion for demo data near the equator
        return round(geom.area * 111_000 * 111_000 / 10_000, 2)
    except Exception:
        return 0.0


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        name=payload.name,
        description=payload.description,
        project_type=payload.project_type,
        owner_id=current_user.id,
    )
    db.add(project)
    db.flush()

    for site_in in payload.sites or []:
        site = Site(
            name=site_in.name,
            project_id=project.id,
            geometry=site_in.geometry,
            area_hectares=site_in.area_hectares or _approx_area_hectares(site_in.geometry),
        )
        db.add(site)

    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=List[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Project)
        .options(joinedload(Project.sites))
        .filter(Project.owner_id == current_user.id)
        .all()
    )


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .options(joinedload(Project.sites))
        .filter(Project.id == project_id, Project.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/{project_id}/sites", response_model=SiteOut, status_code=201)
def add_site(
    project_id: int,
    payload: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(
        Project.id == project_id, Project.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    site = Site(
        name=payload.name,
        project_id=project.id,
        geometry=payload.geometry,
        area_hectares=payload.area_hectares or _approx_area_hectares(payload.geometry),
    )
    db.add(site)
    db.commit()
    db.refresh(site)
    return site
