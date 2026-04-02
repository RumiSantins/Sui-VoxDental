from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, create_engine
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    profile_image = Column(String, nullable=True) # Icon ID or Image URL
    gender = Column(String, default="other") # male, female, other
    is_admin = Column(Boolean, default=False)
    
    patients = relationship("Patient", back_populates="owner", cascade="all, delete-orphan")
    speech_reports = relationship("SpeechReport", back_populates="user", cascade="all, delete-orphan")
    media = relationship("ToothMedia", back_populates="user", cascade="all, delete-orphan")

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="patients")
    records = relationship("ClinicalRecord", back_populates="patient", cascade="all, delete-orphan")

class ClinicalRecord(Base):
    __tablename__ = "clinical_records"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="records")
    findings = relationship("ToothFinding", back_populates="record", cascade="all, delete-orphan")

class ToothFinding(Base):
    __tablename__ = "tooth_findings"
    
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("clinical_records.id"))
    tooth_number = Column(Integer)
    surface = Column(String, nullable=True) # Oclusal, etc.
    condition = Column(String) # Caries, etc.
    
    record = relationship("ClinicalRecord", back_populates="findings")

class SpeechReport(Base):
    __tablename__ = "speech_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    transcript = Column(String)
    expected_meaning = Column(String, nullable=True) # What the user actually wanted
    comment = Column(String, nullable=True)
    is_correct = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="speech_reports")

class ToothMedia(Base) :
    __tablename__ = "tooth_media"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"))
    tooth_number = Column(Integer)
    file_path = Column(String)
    file_type = Column(String) # 'image' | 'video'
    thumbnail_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="media")

from sqlalchemy.orm import sessionmaker

# Database URL - SQLite for MVP
DATABASE_URL = "sqlite:///./voxdental.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
