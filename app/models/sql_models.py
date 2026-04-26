from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey
from app.core.db import Base
import datetime

class MasterItem(Base):
    __tablename__ = "master_items"
    item_code = Column(String(100), primary_key=True, index=True)
    description = Column(String(255))
    abc_code = Column(String(10))
    sic_code = Column(String(50))
    bin_1 = Column(String(100))
    additional_bin = Column(String(255))
    physical_qty = Column(Float, default=0.0)
    frozen_qty = Column(Float, default=0.0)
    weight_per_unit = Column(Float, default=0.0)
    xdock_pending = Column(Integer, default=0)

class Log(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    itemCode = Column(String(100), index=True)
    timestamp = Column(String(100))
    relocatedBin = Column(String(100))
    archived_at = Column(String(100), nullable=True)

class BinLocation(Base):
    __tablename__ = "bin_locations"
    bin_code = Column(String(100), primary_key=True, index=True)
    zone = Column(String(100), index=True)
    level = Column(Integer)
    aisle = Column(String(50))
    spot = Column(String(50))
    score = Column(Integer, default=0)

class SlottingRule(Base):
    __tablename__ = "slotting_rules"
    sic_code = Column(String(50), primary_key=True, index=True)
    ideal_spot = Column(String(50))
    description = Column(String(255))

class AIItemPattern(Base):
    __tablename__ = "ai_item_patterns"
    id = Column(Integer, primary_key=True, autoincrement=True)
    item_code = Column(String(100), index=True)
    bin_code = Column(String(100))
    frequency = Column(Integer, default=1)
    last_updated = Column(String(100))

class AICategoryPattern(Base):
    __tablename__ = "ai_category_patterns"
    id = Column(Integer, primary_key=True, autoincrement=True)
    sic_code = Column(String(50), index=True)
    bin_code = Column(String(100))
    frequency = Column(Integer, default=1)
    last_updated = Column(String(100))

class CycleCount(Base):
    __tablename__ = "cycle_counts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    item_code = Column(String(100))
    timestamp = Column(String(100))

class CycleCountRecording(Base):
    __tablename__ = "cycle_count_recordings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    planned_date = Column(String(50))
    executed_date = Column(String(100))
    item_code = Column(String(100))
    item_description = Column(String(255))
    bin_location = Column(String(255))
    system_qty = Column(Float)
    physical_qty = Column(Float)
    difference = Column(Float)
    username = Column(String(100))
    abc_code = Column(String(10))
