from pydantic import BaseModel
from typing import List, Optional

class FindingSchema(BaseModel):
    tooth_number: int
    surface: Optional[str] = None
    condition: str

class OdontogramUpdateResponse(BaseModel):
    patient_id: int
    record_id: int
    transcription: str
    findings: List[FindingSchema]
    warnings: List[str] = []

class Config:
    orm_mode = True
