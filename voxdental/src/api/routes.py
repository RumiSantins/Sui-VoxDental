from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.nlp import extract_findings_from_text
from ..services.whisper import WhisperService
from ..models.database import engine, Base, ClinicalRecord, ToothFinding, Patient
from ..api.schemas import OdontogramUpdateResponse, FindingSchema
from typing import List

# Create tables for MVP (should be in migration script usually)
Base.metadata.create_all(bind=engine)

router = APIRouter()
whisper_service = WhisperService()

# Dependency
def get_db():
    from ..models.database import SessionLocal
    # Re-creating session logic here slightly redundant but simplest for single-file example
    # Let's fix import above or just do:
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/clinical/voice-entry", response_model=OdontogramUpdateResponse)
async def process_voice_entry(
    file: UploadFile = File(...), 
    patient_id: int = Form(...)
):
    # 1. Transcribe
    # Pass the UploadFile object directly to service (which now handles async read)
    transcription = await whisper_service.transcribe(file)
    
    # 2. NLP Process
    findings_data = extract_findings_from_text(transcription)
    
    # 3. Store in DB (Mocking DB interaction for brevity/robustness in MVP)
    # db_record = ClinicalRecord(patient_id=patient_id)
    # db.add(db_record)
    # db.commit()
    
    # Convert to response schema
    response_findings = []
    warnings = []
    
    for f in findings_data:
        response_findings.append(FindingSchema(
            tooth_number=f.tooth_number,
            surface=f.surface,
            condition=f.condition
        ))
    
    return OdontogramUpdateResponse(
        patient_id=patient_id,
        record_id=123, # Mock
        transcription=transcription,
        findings=response_findings,
        warnings=warnings
    )
