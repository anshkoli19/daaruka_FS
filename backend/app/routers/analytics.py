import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import Site, SiteMetric, Project
from app.schemas import SiteMetricOut

router = APIRouter(prefix="/sites", tags=["analytics"])


def _get_owned_site(db: Session, site_id: int, user: User) -> Site:
    site = (
        db.query(Site)
        .join(Project)
        .filter(Site.id == site_id, Project.owner_id == user.id)
        .first()
    )
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site


@router.get("/{site_id}/metrics", response_model=List[SiteMetricOut])
def get_site_metrics(
    site_id: int,
    months: int = 12,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = _get_owned_site(db, site_id, current_user)

    existing = (
        db.query(SiteMetric)
        .filter(SiteMetric.site_id == site.id)
        .order_by(SiteMetric.date)
        .all()
    )
    if existing:
        return existing

    # No dataset uploaded yet for this site: generate a deterministic mock
    # time series so the dashboard/analytics view is demonstrable end-to-end.
    # See README "Datasets" section for rationale.
    random.seed(site.id)
    rows = []
    base_carbon = random.uniform(50, 200)
    base_bio = random.uniform(0.4, 0.8)
    for i in range(months):
        date = datetime.utcnow() - timedelta(days=30 * (months - i))
        rows.append(
            SiteMetric(
                site_id=site.id,
                date=date,
                carbon_tons=round(base_carbon + i * random.uniform(0.5, 3), 2),
                biodiversity_index=round(min(1.0, base_bio + i * random.uniform(0, 0.01)), 3),
                ndvi=round(random.uniform(0.3, 0.85), 3),
            )
        )
    db.add_all(rows)
    db.commit()
    return rows
