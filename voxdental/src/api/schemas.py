from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str # Se mantiene el nombre 'email' pero permite cualquier string (Nombre de Usuario)
    full_name: Optional[str] = None
    profile_image: Optional[str] = None
    gender: Optional[str] = "other"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserSchema(UserBase):
    id: int
    is_admin: bool = False
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    profile_image: Optional[str] = None
    gender: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class FindingSchema(BaseModel):
    tooth_number: int
    surface: Optional[str] = None
    condition: str

    class Config:
        orm_mode = True

class OdontogramUpdateResponse(BaseModel):
    patient_id: int
    record_id: int
    transcription: str
    findings: List[FindingSchema]
    warnings: List[str] = []

class PatientCreate(BaseModel):
    name: str

class PatientUpdate(BaseModel):
    name: str

class PatientSchema(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        orm_mode = True

class ClinicalRecordSchema(BaseModel):
    id: int
    patient_id: int
    timestamp: datetime
    findings: List[FindingSchema]
    notes: Optional[dict] = None

    class Config:
        orm_mode = True

class ClinicalRecordCreate(BaseModel):
    findings: List[FindingSchema]
    notes: Optional[dict] = None

class SpeechReportBase(BaseModel):
    transcript: str
    expected_meaning: Optional[str] = None
    is_correct: Optional[bool] = True
    comment: Optional[str] = None

class SpeechReportCreate(SpeechReportBase):
    pass

class SpeechReportSchema(SpeechReportBase):
    id: int
    user_id: int
    created_at: datetime
    user_full_name: Optional[str] = None

    class Config:
        from_attributes = True

class ToothMediaSchema(BaseModel):
    id: int
    patient_id: int
    tooth_number: int
    file_url: str
    file_type: str
    thumbnail_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
