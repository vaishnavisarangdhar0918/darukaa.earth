from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Metric(Base):
    __tablename__ = "metrics"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    site_id: Mapped[int] = mapped_column(
        ForeignKey("sites.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Example: carbon, biodiversity
    metric_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    # Measured value, e.g. 125.5
    value: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    # Example: tCO2e, species
    unit: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    site = relationship("Site", backref="metrics")
    