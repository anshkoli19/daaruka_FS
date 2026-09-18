from pydantic import BaseModel, EmailStr
from typing import Optional, Any, List
from datetime import datetime


# ---- Auth ----
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---- Sites ----
class SiteCreate(BaseModel):
    name: str
    geometry: Any  # GeoJSON Polygon
    area_hectares: Optional[float] = None


class SiteOut(BaseModel):
    id: int
    name: str
    project_id: int
    geometry: Any
    area_hectares: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class SiteMetricOut(BaseModel):
    date: datetime
    carbon_tons: float
    biodiversity_index: float
    ndvi: float

    class Config:
        from_attributes = True


# ---- Projects ----
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    project_type: str = "carbon"
    sites: Optional[List[SiteCreate]] = []


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    project_type: str
    created_at: datetime
    sites: List[SiteOut] = []

    class Config:
        from_attributes = True
