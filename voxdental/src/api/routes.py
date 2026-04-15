from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from pydantic import BaseModel
import os
from ..core.nlp import extract_findings_from_text
from ..services.whisper import WhisperService
from ..services.vosk_service import VoskService
from ..models.database import engine, Base, ClinicalRecord, ToothFinding, Patient, User
from ..api.schemas import (
    OdontogramUpdateResponse, FindingSchema, PatientSchema, PatientCreate, 
    ClinicalRecordSchema, PatientUpdate, UserCreate, UserSchema, Token, UserUpdate,
    ClinicalRecordCreate, SpeechReportCreate, SpeechReportSchema, ToothMediaSchema
)
from ..core.auth import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM
from ..core.email_service import send_verification_email
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import uuid
from typing import List
import subprocess
from pathlib import Path

# Create tables for MVP (should be in migration script usually)
Base.metadata.create_all(bind=engine)

router = APIRouter()
whisper_service = WhisperService()
vosk_service = VoskService()

# Dependency
def get_db():
    from ..models.database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- AUTH ROUTES ---

@router.post("/auth/register", response_model=Token)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        if db_user.is_verified:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        
        # Si ya existe pero no estaba verificado, lo verificamos directamente
        db_user.is_verified = True
        db_user.verification_token = None
        db_user.hashed_password = get_password_hash(user.password)
        db.commit()
        return db_user
    
    hashed_password = get_password_hash(user.password)
    verification_token = str(uuid.uuid4())
    
    new_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_verified=True, # Auto-verificado por ahora para facilitar el acceso
        verification_token=None
    )
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
        # (Opcional) Podemos desactivar el envío de correo de prueba por ahora
        # send_verification_email(user.email, None, user.full_name or "")
        
        # Generar token inmediato para auto-login
        access_token = create_access_token(data={
            "sub": new_user.email, 
            "name": new_user.full_name,
            "avatar": new_user.profile_image,
            "gender": new_user.gender,
            "is_admin": new_user.is_admin,
            "is_google": new_user.hashed_password == "google_oauth_no_password"
        })
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auth/verify", response_model=dict)
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Token de verificación inválido")
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"message": "Cuenta verificada con éxito", "email": user.email}

@router.post("/auth/login", response_model=Token)
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tu cuenta aún no ha sido verificada. Revisa tu correo.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={
        "sub": user.email, 
        "name": user.full_name,
        "avatar": user.profile_image,
        "gender": user.gender,
        "is_admin": user.is_admin,
        "is_google": user.hashed_password == "google_oauth_no_password"
    })
    return {"access_token": access_token, "token_type": "bearer"}

class GoogleLoginRequest(BaseModel):
    id_token: str

@router.post("/auth/google-login", response_model=Token)
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID no está configurado")
    
    try:
        # 1. Verificar el token de Google
        idinfo = id_token.verify_oauth2_token(request.id_token, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        # 2. Extraer información del usuario
        email = idinfo['email']
        full_name = idinfo.get('name', '')
        
        # 3. Buscar o crear el usuario en nuestra DB
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Crear usuario automáticamente (ya está verificado de origen por Google)
            user = User(
                email=email,
                full_name=full_name,
                hashed_password="google_oauth_no_password",
                is_verified=True,
                verification_token=None
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # 4. Generar nuestro propio token de acceso
        access_token = create_access_token(data={
            "sub": user.email, 
            "name": user.full_name,
            "avatar": user.profile_image,
            "gender": user.gender,
            "is_admin": user.is_admin,
            "is_google": True
        })
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError:
        # Token inválido
        raise HTTPException(status_code=400, detail="Token de Google inválido")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/auth/me", response_model=Token)
def update_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.full_name:
        current_user.full_name = data.full_name
    
    if data.password:
        current_user.hashed_password = get_password_hash(data.password)
    
    if data.profile_image is not None:
        current_user.profile_image = data.profile_image
    
    if data.gender is not None:
        current_user.gender = data.gender
    
    db.commit()
    db.refresh(current_user)
    
    # Regenerate token with the new name and avatar
    access_token = create_access_token(data={
        "sub": current_user.email, 
        "name": current_user.full_name,
        "avatar": current_user.profile_image,
        "gender": current_user.gender,
        "is_admin": current_user.is_admin,
        "is_google": current_user.hashed_password == "google_oauth_no_password"
    })
    return {"access_token": access_token, "token_type": "bearer"}

# --- CLINICAL ROUTES ---

@router.post("/clinical/voice-entry", response_model=OdontogramUpdateResponse)
async def process_voice_entry(
    file: UploadFile = File(...), 
    patient_id: int = Form(...),
    engine: str = Form("vosk"),
    model_name: str = Form("vosk-model-small-es-0.42"),
    context_tooth: int = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify patient ownership
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    # 1. Transcribe
    if engine.lower() == "whisper":
        transcription = await whisper_service.transcribe(file, requested_model=model_name)
    else:
        transcription = await vosk_service.transcribe(file, model_name)
    
    # 2. NLP Process
    findings_data = extract_findings_from_text(transcription, context_tooth)
    
    # Return pure parsed deltas without hitting DB
    response_findings = []
    for f in findings_data:
        response_findings.append(FindingSchema(
            tooth_number=f.tooth_number,
            surface=f.surface,
            condition=f.condition
        ))
    
    return OdontogramUpdateResponse(
        patient_id=patient_id,
        record_id=0, # Dummy, won't be used since frontend handles it dynamically
        transcription=transcription,
        findings=response_findings,
        warnings=[]
    )

@router.get("/patients", response_model=List[PatientSchema])
def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Patient).filter(Patient.user_id == current_user.id).all()

@router.post("/patients", response_model=PatientSchema)
def create_patient(
    patient: PatientCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        db_patient = Patient(name=patient.name, user_id=current_user.id)
        db.add(db_patient)
        db.commit()
        print("DEBUG: Committed patient")
        db.refresh(db_patient)
        print(f"DEBUG: Refreshed patient, id: {db_patient.id}")
        return db_patient
    except Exception as e:
        print(f"DEBUG: Error in create_patient: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/patients/{patient_id}", response_model=PatientSchema)
def update_patient(
    patient_id: int, 
    patient: PatientUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == current_user.id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    db_patient.name = patient.name
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.delete("/patients/{patient_id}")
def delete_patient(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == current_user.id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    db.delete(db_patient)
    db.commit()
    return {"message": "Paciente eliminado correctamente"}

@router.get("/patients/{patient_id}/records", response_model=List[ClinicalRecordSchema])
def get_patient_records(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify ownership
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == current_user.id).first()
    if not patient:
         raise HTTPException(status_code=404, detail="Paciente no encontrado")
         
    import json
    records = db.query(ClinicalRecord).filter(ClinicalRecord.patient_id == patient_id).all()
    for r in records:
        if r.notes:
            try:
                r.notes = json.loads(r.notes)
            except:
                r.notes = None
    return records

@router.post("/patients/{patient_id}/records", response_model=ClinicalRecordSchema)
def save_full_record(
    patient_id: int, 
    record_data: ClinicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import json
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == current_user.id).first()
    if not patient:
         raise HTTPException(status_code=404, detail="Paciente no encontrado")
         
    # Optional logic: Delete previous records from today before saving?
    # For now, create a new snapshot history track
    db_record = ClinicalRecord(
        patient_id=patient_id,
        notes=json.dumps(record_data.notes) if record_data.notes else None
    )
    db.add(db_record)
    db.flush() 
    
    for f in record_data.findings:
        db_finding = ToothFinding(
            record_id=db_record.id,
            tooth_number=f.tooth_number,
            surface=f.surface,
            condition=f.condition
        )
        db.add(db_finding)
        
    db.commit()
    db.refresh(db_record)
    
    # IMPORTANTE: Parsear las notas de nuevo a objeto antes de devolver la respuesta
    # Esto evita el ResponseValidationError
    if db_record.notes:
        try:
            db_record.notes = json.loads(db_record.notes)
        except:
            pass
            
    return db_record

# --- SPEECH REPORTING ---

@router.post("/reports", response_model=SpeechReportSchema)
def create_legacy_speech_report(
    report: SpeechReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ..models.database import SpeechReport
    db_report = SpeechReport(
        user_id=current_user.id,
        transcript=report.transcript,
        expected_meaning=report.expected_meaning,
        is_correct=report.is_correct
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report



# --- MEDIA ROUTES ---

@router.post("/patients/{patient_id}/media/{tooth_number}", response_model=ToothMediaSchema)
async def upload_tooth_media(
    patient_id: int,
    tooth_number: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import shutil
    from pathlib import Path
    from ..models.database import ToothMedia
    
    # Ensure media directory exists
    media_dir = Path("static/media")
    media_dir.mkdir(parents=True, exist_ok=True)
    
    # Save raw file temporarily using chunked copy (memory safe)
    file_ext = file.filename.split(".")[-1].lower()
    raw_name = f"raw_{uuid.uuid4()}.{file_ext}"
    raw_path = media_dir / raw_name
    
    try:
        with open(raw_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fatal al guardar en disco: {e}")
    
    # Final paths
    # We force .mp4 for video remuxing if it's a video
    final_name = f"{uuid.uuid4()}.mp4" if file_ext != "mp4" else f"{uuid.uuid4()}.mp4"
    if file_ext in ["jpg", "jpeg", "png", "gif", "webp", "bmp"]:
        final_name = f"{uuid.uuid4()}.{file_ext}"
        
    final_path = media_dir / final_name
    file_type = "image" if file_ext in ["jpg", "jpeg", "png", "gif", "webp", "bmp"] else "video"
    thumbnail_path = None
    thumbnail_path = None
    
    ffmpeg_exe = "ffmpeg"
    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        # Fallback to system ffmpeg
        pass
    
    if file_type == "video":
        thumb_name = f"thumb_{final_name.split('.')[0]}.jpg"
        thumb_dest = media_dir / thumb_name
        
        # Check if ffmpeg exists or just try (in Linux/Docker 'ffmpeg' is in PATH)
        try:
            # INSTANT REMUX: Move metadata to front (+faststart) without re-encoding (-c copy)
            # This makes 300MB videos play instantly in the browser without quality loss.
            subprocess.run([
                ffmpeg_exe, "-y", "-i", str(raw_path), 
                "-c", "copy", "-movflags", "+faststart", 
                str(final_path)
            ], capture_output=True, check=False)
            
            # STEP 2: CREATE THUMBNAIL (Ultra fast seek)
            subprocess.run([
                ffmpeg_exe, "-ss", "00:00:01", "-y", "-i", str(final_path if final_path.exists() else raw_path), 
                "-vframes", "1", "-q:v", "4", str(thumb_dest)
            ], capture_output=True, check=False)
            
            if thumb_dest.exists():
                thumbnail_path = f"/api/v1/media/stream/{thumb_name}"
                
            # Clean up raw if remux worked
            if final_path.exists():
                os.remove(raw_path)
            else:
                raw_path.rename(final_path)
                
        except Exception as e:
            print(f"Video processing failed: {e}")
            if not final_path.exists(): raw_path.rename(final_path)
    else:
        # It's an image, just rename raw to final
        raw_path.rename(final_path)

    db_media = ToothMedia(
        user_id=current_user.id,
        patient_id=patient_id,
        tooth_number=tooth_number,
        file_path=f"/api/v1/media/stream/{final_name}",
        file_type=file_type,
        thumbnail_path=thumbnail_path
    )
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    
    return ToothMediaSchema(
        id=db_media.id,
        patient_id=db_media.patient_id,
        tooth_number=db_media.tooth_number,
        file_url=db_media.file_path,
        file_type=db_media.file_type,
        thumbnail_url=db_media.thumbnail_path,
        created_at=db_media.created_at
    )

@router.get("/media/stream/{filename}")
async def stream_media(filename: str, request: Request):
    """
    Serves images and videos with proper Range Request support (essential for iOS/Safari).
    """
    import mimetypes
    # Use self-referencing path to find project root reliably inside Docker
    # __file__ is /app/src/api/routes.py -> parents[2] is /app
    base_dir = Path(__file__).parents[2] / "static" / "media"
    file_path = base_dir / filename
    
    # DEBUG: Print exact path check to server console
    print(f"DEBUG Media Request: {filename}")
    print(f"DEBUG Checking path: {file_path.absolute()}")
    print(f"|-- Exists: {file_path.exists()}")

    # FALLBACK: If the processed file doesn't exist but the 'raw_' version does, serve that.
    if not file_path.exists() and filename.endswith(".mp4") and not filename.startswith("raw_"):
        raw_filename = f"raw_{filename}"
        if (base_dir / raw_filename).exists():
            file_path = base_dir / raw_filename
            print(f"|-- Found Raw Fallback: {file_path}")

    if not file_path.exists():
        print(f"|-- ERROR: 404 Not Found")
        raise HTTPException(status_code=404, detail=f"File not found on server at: {file_path}")
    
    content_type, _ = mimetypes.guess_type(str(file_path))
    if not content_type:
        content_type = "application/octet-stream"
    
    file_size = file_path.stat().st_size
    range_header = request.headers.get("range")
    
    if not range_header or content_type.startswith("image/"):
        # Simple serve for images or requests without Range
        def iterfile():
            with open(file_path, mode="rb") as file_like:
                yield from file_like
        
        return StreamingResponse(
            iterfile(), 
            media_type=content_type,
            headers={"Content-Length": str(file_size)}
        )
    
    # Handle Video Range Requests
    try:
        # Example browser header: "bytes=0-100"
        bytes_range = range_header.replace("bytes=", "").split("-")
        start = int(bytes_range[0])
        end = int(bytes_range[1]) if bytes_range[1] else file_size - 1
        
        if start >= file_size:
            raise HTTPException(status_code=416, detail="Requested Range Not Satisfiable")
        
        chunk_size = (end - start) + 1
        
        def iter_video_chunk():
            with open(file_path, mode="rb") as f:
                f.seek(start)
                yield f.read(chunk_size)
        
        return StreamingResponse(
            iter_video_chunk(),
            status_code=206, # Partial Content
            media_type=content_type,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_size)
            }
        )
    except Exception:
        # Fallback to full file if range parsing fails
        def iterfile():
            with open(file_path, mode="rb") as file_like:
                yield from file_like
        return StreamingResponse(iterfile(), media_type=content_type)

@router.get("/patients/{patient_id}/media/{tooth_number}", response_model=List[ToothMediaSchema])
def get_tooth_media(
    patient_id: int,
    tooth_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ..models.database import ToothMedia
    media_list = db.query(ToothMedia).filter(
        ToothMedia.patient_id == patient_id,
        ToothMedia.tooth_number == tooth_number
    ).all()
    
    # Use dynamic ffmpeg logic for consistency
    ffmpeg_exe = "ffmpeg"
    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    
    # Reparador de miniaturas (para videos viejos o fallidos)
    for m in media_list:
        if m.file_type == "video" and not m.thumbnail_path:
            file_disk_path = m.file_path.lstrip("/")
            thumb_name = f"thumb_{m.file_path.split('/')[-1].split('.')[0]}.jpg"
            thumb_dest = f"static/media/{thumb_name}"
            
            if os.path.exists(file_disk_path) and os.path.exists(ffmpeg_exe):
                try:
                    subprocess.run([
                        ffmpeg_exe, "-ss", "00:00:01", "-y", "-i", file_disk_path,
                        "-vframes", "1", "-q:v", "4", thumb_dest
                    ], capture_output=True, timeout=5)
                    
                    if os.path.exists(thumb_dest):
                        m.thumbnail_path = f"/static/media/{thumb_name}"
                        db.commit()
                except Exception as e:
                    print(f"Shadow thumbnail repair failed for {m.id}: {e}")

    # Ensure all urls use the streaming gateway
    for m in media_list:
        if m.file_path.startswith("/static/media/"):
            m.file_path = m.file_path.replace("/static/media/", "/api/v1/media/stream/")
        if m.thumbnail_path and m.thumbnail_path.startswith("/static/media/"):
            m.thumbnail_path = m.thumbnail_path.replace("/static/media/", "/api/v1/media/stream/")

    return [ToothMediaSchema(
        id=m.id,
        patient_id=m.patient_id,
        tooth_number=m.tooth_number,
        file_url=m.file_path,
        file_type=m.file_type,
        thumbnail_url=m.thumbnail_path,
        created_at=m.created_at
    ) for m in media_list]

@router.delete("/media/{media_id}")
def delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ..models.database import ToothMedia
    db_media = db.query(ToothMedia).filter(ToothMedia.id == media_id, ToothMedia.user_id == current_user.id).first()
    if not db_media:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    # Delete file from disk
    file_disk_path = db_media.file_path.lstrip("/")
    if os.path.exists(file_disk_path):
        os.remove(file_disk_path)
    
    if db_media.thumbnail_path:
        thumb_disk_path = db_media.thumbnail_path.lstrip("/")
        if os.path.exists(thumb_disk_path):
            os.remove(thumb_disk_path)
    
    db.delete(db_media)
    db.commit()
    return {"message": "Archivo eliminado"}

# --- VIDEO STREAMING WITH RANGE SUPPORT ---

@router.get("/stream/{filename}")
async def stream_video(filename: str, request: Request):
    """Serve video files with proper Range request support for browser playback."""
    file_path = Path("static/media") / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    file_size = file_path.stat().st_size
    range_header = request.headers.get("Range")
    
    # Determine content type
    ext = filename.split(".")[-1].lower()
    content_type_map = {
        "mp4": "video/mp4",
        "webm": "video/webm",
        "mov": "video/quicktime",
        "avi": "video/x-msvideo",
        "mkv": "video/x-matroska",
    }
    content_type = content_type_map.get(ext, "video/mp4")
    
    def iterate_file(start: int, end: int, chunk_size: int = 1024 * 1024):
        with open(file_path, "rb") as f:
            f.seek(start)
            remaining = end - start + 1
            while remaining > 0:
                read_size = min(chunk_size, remaining)
                data = f.read(read_size)
                if not data:
                    break
                remaining -= len(data)
                yield data
    
    if range_header:
        # Parse Range header: "bytes=start-end"
        range_val = range_header.replace("bytes=", "")
        parts = range_val.split("-")
        start = int(parts[0]) if parts[0] else 0
        end = int(parts[1]) if parts[1] else file_size - 1
        end = min(end, file_size - 1)
        
        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(end - start + 1),
            "Content-Type": content_type,
        }
        return StreamingResponse(
            iterate_file(start, end),
            status_code=206,
            headers=headers,
            media_type=content_type
        )
    else:
        headers = {
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
        }
        return StreamingResponse(
            iterate_file(0, file_size - 1),
            headers=headers,
            media_type=content_type
        )

@router.post("/speech-reports", response_model=SpeechReportSchema)
def create_speech_report(
    report: SpeechReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ..models.database import SpeechReport
    db_report = SpeechReport(
        user_id=current_user.id,
        transcript=report.transcript,
        expected_meaning=report.expected_meaning,
        comment=report.comment,
        is_correct=report.is_correct
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@router.get("/admin/reports", response_model=list[SpeechReportSchema])
def get_admin_reports(
    db: Session = Depends(get_db)
):
    # Endpoint de administrador desprotegido (requiere autenticación custom en front)
    from ..models.database import SpeechReport, User
    
    # Query reporting data with user names
    results = db.query(SpeechReport, User.full_name).join(User, SpeechReport.user_id == User.id).order_by(SpeechReport.created_at.desc()).all()
    
    reports = []
    for report, full_name in results:
        # Create a dictionary that matches SpeechReportSchema
        report_dict = {
            "id": report.id,
            "user_id": report.user_id,
            "transcript": report.transcript,
            "expected_meaning": report.expected_meaning,
            "comment": report.comment,
            "is_correct": report.is_correct,
            "created_at": report.created_at,
            "user_full_name": full_name
        }
        reports.append(report_dict)
        
    return reports
