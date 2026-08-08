import os
import json
import sqlite3
import pathlib
import uuid
import tempfile
from datetime import datetime
from typing import Dict, List, Any
import requests

from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Initialize FastAPI App
app = FastAPI()

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths and Folders setup
UPLOAD_DIR = pathlib.Path(os.getenv("UPLOAD_DIR", "uploads"))
AUDIO_DIR = UPLOAD_DIR / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# Mount uploads folder to serve audio files statically (for local SQLite mode)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Supabase Credentials Configuration (for Stateless Production deployment)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
IS_SUPABASE = bool(SUPABASE_URL and SUPABASE_KEY)

DB_PATH = os.getenv("DB_PATH", "lexara_dataset.db")

# Database initialization (only for local SQLite mode)
def init_local_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        language TEXT NOT NULL,
        dialect TEXT,
        points INTEGER DEFAULT 120,
        solo_progress INTEGER DEFAULT 0
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        image_id TEXT NOT NULL,
        transcription TEXT NOT NULL,
        audio_path TEXT NOT NULL,
        dialect TEXT NOT NULL,
        language TEXT NOT NULL,
        agreement_score INTEGER DEFAULT 0,
        consensus_text TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL
    )
    """)
    cursor.execute("SELECT username FROM users WHERE username = 'vincent.chidiebere@outlook.com'")
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO users (username, password, language, dialect, points) VALUES (?, ?, ?, ?, ?)",
            ("vincent.chidiebere@outlook.com", "Vincent1993#", "Igbo", "Onitsha", 500)
        )
    conn.commit()
    conn.close()

if not IS_SUPABASE:
    init_local_db()

# Models
class SignupRequest(BaseModel):
    username: str
    password: str
    language: str
    dialect: str = ""

class LoginRequest(BaseModel):
    username: str
    password: str

class VerifyRequest(BaseModel):
    submission_id: int
    status: str
    consensus_text: str = None


# SUPABASE REST API UTILITIES

def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def supabase_get_user(username: str):
    url = f"{SUPABASE_URL}/rest/v1/users?username=eq.{username}"
    res = requests.get(url, headers=get_supabase_headers())
    if res.status_code == 200:
        users = res.json()
        return users[0] if users else None
    return None

def supabase_update_user(username: str, data: dict):
    url = f"{SUPABASE_URL}/rest/v1/users?username=eq.{username}"
    requests.patch(url, headers=get_supabase_headers(), json=data)

def supabase_upload_audio(file_path: str, file_name: str) -> str:
    # Upload to Supabase Storage Bucket named 'lexara-audio'
    url = f"{SUPABASE_URL}/storage/v1/object/lexara-audio/{file_name}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "audio/wav"
    }
    with open(file_path, "rb") as f:
        file_data = f.read()
    res = requests.post(url, headers=headers, data=file_data)
    if res.status_code not in (200, 201):
        raise Exception(f"Supabase storage upload failed: {res.text}")
    # Return the public URL
    return f"{SUPABASE_URL}/storage/v1/object/public/lexara-audio/{file_name}"


# DUAL MODE DATABASE ACCESSORS

def get_user_profile(username: str):
    if IS_SUPABASE:
        return supabase_get_user(username)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None

def update_user_points(username: str, points: int, progress: int):
    if IS_SUPABASE:
        supabase_update_user(username, {"points": points, "solo_progress": progress})
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET points = ?, solo_progress = ? WHERE username = ?",
        (points, progress, username)
    )
    conn.commit()
    conn.close()


# REST ENDPOINTS

@app.post("/api/signup")
def signup(req: SignupRequest):
    if IS_SUPABASE:
        # Check if user exists
        existing = supabase_get_user(req.username)
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Insert to Supabase Postgres
        url = f"{SUPABASE_URL}/rest/v1/users"
        payload = {
            "username": req.username,
            "password": req.password,
            "language": req.language,
            "dialect": req.dialect if req.dialect else None,
            "points": 120,
            "solo_progress": 0
        }
        res = requests.post(url, headers=get_supabase_headers(), json=payload)
        if res.status_code not in (200, 201):
            raise HTTPException(status_code=500, detail=f"Database error: {res.text}")
        return {"message": "Signup successful", "username": req.username}

    # SQLite Fallback Mode
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE username = ?", (req.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")
    cursor.execute(
        "INSERT INTO users (username, password, language, dialect, points, solo_progress) VALUES (?, ?, ?, ?, 120, 0)",
        (req.username, req.password, req.language, req.dialect if req.dialect else None)
    )
    conn.commit()
    conn.close()
    return {"message": "Signup successful", "username": req.username}

@app.post("/api/login")
def login(req: LoginRequest):
    user = get_user_profile(req.username)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    return {
        "username": user["username"],
        "language": user["language"],
        "dialect": user["dialect"] if user["dialect"] else "",
        "points": user["points"],
        "solo_progress": user["solo_progress"]
    }

@app.post("/api/upload-audio")
async def upload_audio(audio: UploadFile = File(...)):
    # Save audio file temporarily
    file_ext = os.path.splitext(audio.filename)[1] if audio.filename else ".wav"
    file_name = f"{uuid.uuid4()}{file_ext}"
    temp_path = AUDIO_DIR / file_name
    
    with open(temp_path, "wb") as buffer:
        buffer.write(await audio.read())
        
    # Transcribe audio using Whisper
    from validate_description import transcribe_audio
    try:
        text = transcribe_audio(str(temp_path))
        
        if IS_SUPABASE:
            # Upload to Cloud Bucket and get public link, then remove local temp
            audio_url = supabase_upload_audio(str(temp_path), file_name)
            if temp_path.exists():
                temp_path.unlink()
        else:
            # Leave local file and return local mount link
            audio_url = f"/uploads/audio/{file_name}"
            
    except Exception as e:
        if temp_path.exists():
            temp_path.unlink()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
        
    return {
        "audio_url": audio_url,
        "transcription": text
    }

@app.post("/api/validate")
async def validate(
    audio: UploadFile = File(...),
    image: UploadFile = File(...),
    language: str = Form(...),
    dialect: str = Form(...),
    username: str = Form(...),
    image_id: str = Form(...)
):
    # Save uploaded files temporarily
    file_ext = os.path.splitext(audio.filename)[1] if audio.filename else ".wav"
    audio_file_name = f"{uuid.uuid4()}{file_ext}"
    temp_audio_path = AUDIO_DIR / audio_file_name
    
    with open(temp_audio_path, "wb") as buffer:
        buffer.write(await audio.read())

    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(image.filename)[1]) as tmp_image:
        tmp_image.write(await image.read())
        image_path = tmp_image.name

    try:
        # Load API keys and run validation
        from validate_description import validate_description
        result = validate_description(image_path, str(temp_audio_path), language)
        
        # Pull player current state from db
        user = get_user_profile(username)
        current_points = user["points"] if user else 120
        current_progress = user["solo_progress"] if user else 0
        
        points_earned = 0
        
        from validate_description import transcribe_audio
        try:
            transcription_text = transcribe_audio(str(temp_audio_path))
        except Exception:
            transcription_text = "Spontaneous description recorded."
            
        word_count = len(transcription_text.split())
        
        is_fully_valid = (
            result.get("accept", False) and 
            result.get("confidence", 0) >= 80 and 
            word_count >= 8
        )
        
        if is_fully_valid:
            current_progress += 1
            if current_progress >= 10:
                points_earned = 1
                current_points += 1
                current_progress = 0
            status = 'approved'
        else:
            status = 'pending'
            
        if user:
            update_user_points(username, current_points, current_progress)
            
        # Handle audio storage and DB record save based on mode
        if IS_SUPABASE:
            # Upload to Cloud Bucket
            audio_url = supabase_upload_audio(str(temp_audio_path), audio_file_name)
            # Remove temp file
            if temp_audio_path.exists():
                temp_audio_path.unlink()
                
            # Insert to Supabase Submissions PostgreSQL
            sub_url = f"{SUPABASE_URL}/rest/v1/submissions"
            sub_payload = {
                "username": username,
                "image_id": image_id,
                "transcription": transcription_text,
                "audio_path": audio_url,
                "dialect": dialect,
                "language": language,
                "agreement_score": result.get("confidence", 0),
                "consensus_text": transcription_text,
                "status": status,
                "created_at": datetime.now().isoformat()
            }
            requests.post(sub_url, headers=get_supabase_headers(), json=sub_payload)
        else:
            audio_url = f"/uploads/audio/{audio_file_name}"
            # Insert to local SQLite
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO submissions (username, image_id, transcription, audio_path, dialect, language, agreement_score, consensus_text, status, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (username, image_id, transcription_text, audio_url, dialect, language, 
                 result.get("confidence", 0), transcription_text, status, datetime.now().isoformat())
            )
            conn.commit()
            conn.close()
        
        return {
            "confidence": result.get("confidence", 0),
            "accept": is_fully_valid,
            "feedback_message": result.get("feedback_message", ""),
            "transcription": transcription_text,
            "points_earned": points_earned,
            "progress_increment": 1 if is_fully_valid else 0,
            "new_progress": current_progress,
            "new_points": current_points,
            "language_detected": result.get("language_detected", language)
        }
        
    except Exception as e:
        if temp_audio_path.exists():
            temp_audio_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(image_path):
            os.unlink(image_path)

@app.get("/api/admin/submissions")
def admin_submissions():
    if IS_SUPABASE:
        url = f"{SUPABASE_URL}/rest/v1/submissions?order=id.desc"
        res = requests.get(url, headers=get_supabase_headers())
        if res.status_code == 200:
            return res.json()
        return []

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM submissions ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/api/admin/verify")
def admin_verify(req: VerifyRequest):
    if IS_SUPABASE:
        url = f"{SUPABASE_URL}/rest/v1/submissions?id=eq.{req.submission_id}"
        payload = {"status": req.status}
        if req.consensus_text:
            payload["consensus_text"] = req.consensus_text
        res = requests.patch(url, headers=get_supabase_headers(), json=payload)
        if res.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail=f"Database update failed: {res.text}")
        return {"message": "Submission verification updated successfully"}

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM submissions WHERE id = ?", (req.submission_id,))
    sub = cursor.fetchone()
    if not sub:
        conn.close()
        raise HTTPException(status_code=404, detail="Submission not found")
        
    if req.consensus_text:
        cursor.execute(
            "UPDATE submissions SET status = ?, consensus_text = ? WHERE id = ?",
            (req.status, req.consensus_text, req.submission_id)
        )
    else:
        cursor.execute(
            "UPDATE submissions SET status = ? WHERE id = ?",
            (req.status, req.submission_id)
        )
    conn.commit()
    conn.close()
    return {"message": "Submission verification updated successfully"}

@app.get("/api/health")
def health():
    return {
        "status": "Lexara backend is running",
        "database_mode": "Supabase PostgreSQL" if IS_SUPABASE else "Local SQLite"
    }


# WEBSOCKETS MULTIPLAYER ENGINE

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.player_profiles: Dict[WebSocket, Dict[str, str]] = {}
        self.rooms: Dict[str, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, username: str, language: str, dialect: str):
        if room_id in self.rooms:
            expected_lang = self.rooms[room_id]["language"]
            if expected_lang != language:
                await websocket.accept()
                await websocket.send_json({
                    "type": "error",
                    "message": f"Tribe Mismatch: This room is restricted to {expected_lang} speakers only."
                })
                await websocket.close()
                return False

        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
            
        self.active_connections[room_id].append(websocket)
        self.player_profiles[websocket] = {
            "username": username,
            "language": language,
            "dialect": dialect
        }
        
        if room_id not in self.rooms:
            self.rooms[room_id] = {
                "host": username,
                "language": language,
                "consensus_progress": 0,
                "status": "selecting",
                "stimulus_id": "",
                "submissions": [],
                "votes": {},
                "corrections": {}
            }
            
        return True

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
                
            if len(self.active_connections[room_id]) == 0:
                del self.active_connections[room_id]
                if room_id in self.rooms:
                    del self.rooms[room_id]
                    
        if websocket in self.player_profiles:
            del self.player_profiles[websocket]

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_json(message)

    def get_room_players(self, room_id: str) -> List[Dict[str, str]]:
        players = []
        if room_id in self.active_connections:
            for ws in self.active_connections[room_id]:
                if ws in self.player_profiles:
                    players.append(self.player_profiles[ws])
        return players

manager = ConnectionManager()


@app.websocket("/ws/lobby/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, username: str, language: str, dialect: str = ""):
    connected = await manager.connect(websocket, room_id, username, language, dialect)
    if not connected:
        return

    try:
        players = manager.get_room_players(room_id)
        room_info = manager.rooms[room_id]
        
        await manager.broadcast(room_id, {
            "type": "room_state",
            "room_id": room_id,
            "players": players,
            "host": room_info["host"],
            "status": room_info["status"],
            "stimulus_id": room_info["stimulus_id"],
            "consensus_progress": room_info["consensus_progress"],
            "submissions": room_info["submissions"],
            "votes": room_info["votes"],
            "corrections": room_info["corrections"]
        })

        while True:
            data = await websocket.receive_text()
            event = json.loads(data)
            room_state = manager.rooms[room_id]
            
            if event["type"] == "select_stimulus":
                room_state["status"] = "describing"
                room_state["stimulus_id"] = event["stimulus_id"]
                room_state["submissions"] = []
                room_state["votes"] = {}
                room_state["corrections"] = {}
                
                await manager.broadcast(room_id, {
                    "type": "stimulus_selected",
                    "stimulus_id": event["stimulus_id"],
                    "status": "describing"
                })
                
            elif event["type"] == "speech_submitted":
                submission_details = {
                    "username": username,
                    "dialect": dialect,
                    "text": event["text"],
                    "audio_url": event["audio_url"]
                }
                room_state["submissions"].append(submission_details)
                
                await manager.broadcast(room_id, {
                    "type": "peer_submission",
                    "submissions": room_state["submissions"]
                })
                
            elif event["type"] == "transition_voting":
                room_state["status"] = "voting"
                await manager.broadcast(room_id, {
                    "type": "voting_phase",
                    "status": "voting"
                })
                
            elif event["type"] == "submit_vote":
                target_user = event["target_user"]
                approve = event["approve"]
                
                if target_user not in room_state["votes"]:
                    room_state["votes"][target_user] = {}
                    
                room_state["votes"][target_user][username] = approve
                
                await manager.broadcast(room_id, {
                    "type": "votes_updated",
                    "votes": room_state["votes"]
                })
                
            elif event["type"] == "suggest_correction":
                target_user = event["target_user"]
                corrected_text = event["text"]
                room_state["corrections"][target_user] = corrected_text
                
                await manager.broadcast(room_id, {
                    "type": "corrections_updated",
                    "corrections": room_state["corrections"]
                })
                
            elif event["type"] == "commit_consensus":
                final_submissions = event["final_submissions"]
                
                saved_count = 0
                if IS_SUPABASE:
                    sub_url = f"{SUPABASE_URL}/rest/v1/submissions"
                    for speaker, data_item in final_submissions.items():
                        if data_item["approved"]:
                            sub_obj = next((s for s in room_state["submissions"] if s["username"] == speaker), None)
                            if sub_obj:
                                payload = {
                                    "username": speaker,
                                    "image_id": room_state["stimulus_id"],
                                    "transcription": sub_obj["text"],
                                    "audio_path": sub_obj["audio_url"],
                                    "dialect": sub_obj["dialect"],
                                    "language": room_state["language"],
                                    "agreement_score": 100,
                                    "consensus_text": data_item["text"],
                                    "status": "approved",
                                    "created_at": datetime.now().isoformat()
                                }
                                requests.post(sub_url, headers=get_supabase_headers(), json=payload)
                                saved_count += 1
                else:
                    conn = sqlite3.connect(DB_PATH)
                    cursor = conn.cursor()
                    for speaker, data_item in final_submissions.items():
                        if data_item["approved"]:
                            sub_obj = next((s for s in room_state["submissions"] if s["username"] == speaker), None)
                            if sub_obj:
                                cursor.execute(
                                    """INSERT INTO submissions (username, image_id, transcription, audio_path, dialect, language, agreement_score, consensus_text, status, created_at)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)""",
                                    (speaker, room_state["stimulus_id"], sub_obj["text"], sub_obj["audio_url"], sub_obj["dialect"], room_state["language"], 
                                     100, data_item["text"], datetime.now().isoformat())
                                )
                                saved_count += 1
                    conn.commit()
                    conn.close()
                
                # Check consensus points rewards:
                if saved_count > 0:
                    room_state["consensus_progress"] += 1
                    
                    if room_state["consensus_progress"] >= 3:
                        room_players = manager.get_room_players(room_id)
                        
                        if IS_SUPABASE:
                            for p in room_players:
                                p_profile = supabase_get_user(p["username"])
                                if p_profile:
                                    supabase_update_user(p["username"], {"points": p_profile["points"] + 1})
                        else:
                            db_conn = sqlite3.connect(DB_PATH)
                            db_cursor = db_conn.cursor()
                            for p in room_players:
                                db_cursor.execute("UPDATE users SET points = points + 1 WHERE username = ?", (p["username"],))
                            db_conn.commit()
                            db_conn.close()
                        
                        room_state["consensus_progress"] = 0
                        
                        await manager.broadcast(room_id, {
                            "type": "consensus_coin_awarded",
                            "message": "Consensus Threshold Cleared! +1 Coin awarded to all participants."
                        })
                
                room_state["status"] = "selecting"
                room_state["stimulus_id"] = ""
                room_state["submissions"] = []
                room_state["votes"] = {}
                room_state["corrections"] = {}
                
                await manager.broadcast(room_id, {
                    "type": "consensus_committed",
                    "consensus_progress": room_state["consensus_progress"],
                    "status": "selecting"
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        players = manager.get_room_players(room_id)
        if room_id in manager.rooms:
            room_info = manager.rooms[room_id]
            await manager.broadcast(room_id, {
                "type": "room_state",
                "room_id": room_id,
                "players": players,
                "host": room_info["host"],
                "status": room_info["status"],
                "stimulus_id": room_info["stimulus_id"],
                "consensus_progress": room_info["consensus_progress"],
                "submissions": room_info["submissions"],
                "votes": room_info["votes"],
                "corrections": room_info["corrections"]
            })