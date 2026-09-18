from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    project_type = Column(String, default="carbon")  # carbon | biodiversity
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="projects")
    sites = relationship("Site", back_populates="project", cascade="all, delete-orphan")


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    # GeoJSON Polygon stored as JSON. In a Postgres+PostGIS deployment this
    # column can be swapped for GeoAlchemy2's Geometry("POLYGON", srid=4326)
    # to enable native spatial indexing/queries (ST_Area, ST_Intersects, etc).
    geometry = Column(JSON, nullable=False)
    area_hectares = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="sites")
    metrics = relationship("SiteMetric", back_populates="site", cascade="all, delete-orphan")


class SiteMetric(Base):
    __tablename__ = "site_metrics"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"))
    date = Column(DateTime(timezone=True), nullable=False)
    carbon_tons = Column(Float, default=0)
    biodiversity_index = Column(Float, default=0)
    ndvi = Column(Float, default=0)  # vegetation health proxy

    site = relationship("Site", back_populates="metrics")
