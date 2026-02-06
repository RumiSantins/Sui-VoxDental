from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, create_engine
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    records = relationship("ClinicalRecord", back_populates="patient")

class ClinicalRecord(Base):
    __tablename__ = "clinical_records"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="records")
    findings = relationship("ToothFinding", back_populates="record")

class ToothFinding(Base):
    __tablename__ = "tooth_findings"
    
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("clinical_records.id"))
    tooth_number = Column(Integer)
    surface = Column(String, nullable=True) # Oclusal, etc.
    condition = Column(String) # Caries, etc.
    
    record = relationship("ClinicalRecord", back_populates="findings")

# Database URL - SQLite for MVP
DATABASE_URL = "sqlite:///./voxdental.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
