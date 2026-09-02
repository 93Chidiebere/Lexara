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

# Try importing psycopg2 for production PostgreSQL
try:
    import psycopg2
    HAS_POSTGRES = True
except ImportError:
    HAS_POSTGRES = False

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

# DB Mode Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
IS_POSTGRES = bool(DATABASE_URL and HAS_POSTGRES)
DB_PATH = os.getenv("DB_PATH", "lexara_dataset.db")

# Cloud Audio Storage (Cloudinary vs Supabase fallback vs Local)
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_PRESET = os.getenv("CLOUDINARY_PRESET")
IS_CLOUDINARY = bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_PRESET)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
IS_SUPABASE_STORAGE = bool(SUPABASE_URL and SUPABASE_KEY)

# Unified Query Executor & Database abstraction
def get_db_connection():
    if IS_POSTGRES:
        return psycopg2.connect(DATABASE_URL)
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def execute_query(query: str, params: tuple = ()):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # SQLite uses '?' placeholder, PostgreSQL uses '%s'
    if not IS_POSTGRES:
        query = query.replace("%s", "?")
        
    cursor.execute(query, params)
    
    rows = None
    if query.strip().upper().startswith("SELECT"):
        if IS_POSTGRES:
            colnames = [desc[0] for desc in cursor.description]
            rows = [dict(zip(colnames, row)) for row in cursor.fetchall()]
        else:
            rows = [dict(row) for row in cursor.fetchall()]
    else:
        conn.commit()
        
    conn.close()
    return rows

# Initialize DB structure
def init_db():
    needs_migration = False
    if IS_POSTGRES:
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT 1 FROM information_schema.tables WHERE table_name='users'")
            if cursor.fetchone():
                cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='email'")
                if not cursor.fetchone():
                    needs_migration = True
            if needs_migration:
                cursor.execute("DROP TABLE IF EXISTS users CASCADE")
                cursor.execute("DROP TABLE IF EXISTS submissions CASCADE")
        except Exception:
            pass
        conn.commit()
        conn.close()
    else:
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("PRAGMA table_info(users)")
            rows = cursor.fetchall()
            if rows:
                columns = [row[1] for row in rows]
                if 'email' not in columns:
                    needs_migration = True
            if needs_migration:
                cursor.execute("DROP TABLE IF EXISTS users")
                cursor.execute("DROP TABLE IF EXISTS submissions")
        except Exception:
            pass
        conn.commit()
        conn.close()

    if IS_POSTGRES:
        # Create Postgres tables if they do not exist
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(255) NOT NULL,
            fullname VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            language VARCHAR(255) NOT NULL,
            dialect VARCHAR(255),
            points INTEGER DEFAULT 0,
            solo_progress INTEGER DEFAULT 0
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS submissions (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            image_id VARCHAR(255) NOT NULL,
            transcription TEXT NOT NULL,
            audio_path TEXT NOT NULL,
            dialect VARCHAR(255) NOT NULL,
            language VARCHAR(255) NOT NULL,
            agreement_score INTEGER DEFAULT 0,
            consensus_text TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            created_at VARCHAR(255) NOT NULL
        )
        """)
        # Seed default admin user
        cursor.execute("SELECT username FROM users WHERE username = %s", ("vincent.chidiebere@outlook.com",))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO users (username, email, phone, fullname, password, location, language, dialect, points) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                ("vincent.chidiebere@outlook.com", "vincent.chidiebere@outlook.com", "08000000000", "Vincent Chidiebere", "Vincent1993#", "Lagos, Nigeria", "Igbo", "Onitsha", 500)
            )
        conn.commit()
        
        # Safely migrate existing Postgres databases that might not have the points or solo_progress columns
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0")
        except Exception:
            conn.rollback() # Required in Postgres before next try
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN solo_progress INTEGER DEFAULT 0")
        except Exception:
            conn.rollback()
            pass
            
        conn.commit()
        conn.close()
    else:
        # Initialize SQLite tables
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            fullname TEXT NOT NULL,
            password TEXT NOT NULL,
            location TEXT NOT NULL,
            language TEXT NOT NULL,
            dialect TEXT,
            points INTEGER DEFAULT 0,
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
                "INSERT INTO users (username, email, phone, fullname, password, location, language, dialect, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ("vincent.chidiebere@outlook.com", "vincent.chidiebere@outlook.com", "08000000000", "Vincent Chidiebere", "Vincent1993#", "Lagos, Nigeria", "Igbo", "Onitsha", 500)
            )
        conn.commit()
        
        # Safely migrate existing databases that might not have the points or solo_progress columns
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN solo_progress INTEGER DEFAULT 0")
        except Exception:
            pass
            
        conn.commit()
        conn.close()

try:
    init_db()
except Exception as e:
    print(f"DATABASE INITIALIZATION ERROR: {e}")

# Models
class SignupRequest(BaseModel):
    username: str
    email: str
    phone: str
    fullname: str
    password: str
    location: str
    language: str
    dialect: str = ""

class LoginRequest(BaseModel):
    username: str
    password: str

class VerifyRequest(BaseModel):
    submission_id: int
    status: str
    consensus_text: str = None


# CLOUD UPLOAD UTILITIES

def upload_audio_to_cloudinary(file_path: str, file_name: str) -> str:
    url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/raw/upload"
    with open(file_path, "rb") as f:
        file_data = f.read()
    res = requests.post(
        url,
        data={"upload_preset": CLOUDINARY_PRESET, "public_id": file_name},
        files={"file": (file_name, file_data, "audio/wav")}
    )
    if res.status_code not in (200, 201):
        raise Exception(f"Cloudinary upload failed: {res.text}")
    return res.json()["secure_url"]

def upload_audio_to_supabase(file_path: str, file_name: str) -> str:
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
    return f"{SUPABASE_URL}/storage/v1/object/public/lexara-audio/{file_name}"

def upload_file_handler(temp_path: str, file_name: str) -> str:
    if IS_CLOUDINARY:
        return upload_audio_to_cloudinary(temp_path, file_name)
    elif IS_SUPABASE_STORAGE:
        return upload_audio_to_supabase(temp_path, file_name)
    else:
        return f"/uploads/audio/{file_name}"


# REST ENDPOINTS

@app.post("/api/signup")
def signup(req: SignupRequest):
    # Check if user exists by username or email
    users = execute_query("SELECT username FROM users WHERE username = %s OR email = %s", (req.username, req.email))
    if users:
        raise HTTPException(status_code=400, detail="Username or email already exists")
        
    execute_query(
        "INSERT INTO users (username, email, phone, fullname, password, location, language, dialect, points, solo_progress) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 0, 0)",
        (req.username, req.email, req.phone, req.fullname, req.password, req.location, req.language, req.dialect if req.dialect else None)
    )
    return {"message": "Signup successful", "username": req.username}

@app.post("/api/login")
def login(req: LoginRequest):
    # Support signing in using email or username
    users = execute_query("SELECT * FROM users WHERE username = %s OR email = %s", (req.username, req.username))
    if not users or users[0]["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid username/email or password")
        
    user = users[0]
    return {
        "username": user["username"],
        "email": user["email"],
        "phone": user["phone"],
        "fullname": user["fullname"],
        "location": user["location"],
        "language": user["language"],
        "dialect": user["dialect"] if user["dialect"] else "",
        "points": user["points"],
        "solo_progress": user["solo_progress"]
    }

@app.post("/api/upload-audio")
async def upload_audio(audio: UploadFile = File(...)):
    file_ext = os.path.splitext(audio.filename)[1] if audio.filename else ".wav"
    file_name = f"{uuid.uuid4()}{file_ext}"
    temp_path = AUDIO_DIR / file_name
    
    with open(temp_path, "wb") as buffer:
        buffer.write(await audio.read())
        
    from validate_description import transcribe_audio
    try:
        text = transcribe_audio(str(temp_path))
        audio_url = upload_file_handler(str(temp_path), file_name)
        
        # Cleanup temp file if uploaded to cloud
        if (IS_CLOUDINARY or IS_SUPABASE_STORAGE) and temp_path.exists():
            temp_path.unlink()
            
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
    file_ext = os.path.splitext(audio.filename)[1] if audio.filename else ".wav"
    audio_file_name = f"{uuid.uuid4()}{file_ext}"
    temp_audio_path = AUDIO_DIR / audio_file_name
    
    with open(temp_audio_path, "wb") as buffer:
        buffer.write(await audio.read())

    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(image.filename)[1]) as tmp_image:
        tmp_image.write(await image.read())
        image_path = tmp_image.name

    try:
        from validate_description import transcribe_audio
        try:
            transcription_text = transcribe_audio(str(temp_audio_path))
        except Exception:
            transcription_text = "Spontaneous description recorded."
            
        word_count = len(transcription_text.split())
        
        if image_id.startswith("scenario-"):
            is_fully_valid = word_count >= 8
            result = {
                "accept": is_fully_valid,
                "confidence": 95 if is_fully_valid else 50,
                "feedback_message": "Scenario validation successful!" if is_fully_valid else "Please describe the scenario in more detail (at least 8 words)."
            }
        else:
            from validate_description import validate_description
            result = validate_description(image_path, str(temp_audio_path), language)
        
        users = execute_query("SELECT * FROM users WHERE username = %s", (username,))
        user = users[0] if users else None
        
        current_points = user["points"] if user else 120
        current_progress = user["solo_progress"] if user else 0
        
        points_earned = 0
        
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
            execute_query(
                "UPDATE users SET points = %s, solo_progress = %s WHERE username = %s",
                (current_points, current_progress, username)
            )
            
        audio_url = upload_file_handler(str(temp_audio_path), audio_file_name)
        
        # Cleanup local audio file if uploaded to cloud
        if (IS_CLOUDINARY or IS_SUPABASE_STORAGE) and temp_audio_path.exists():
            temp_audio_path.unlink()
            
        execute_query(
            """INSERT INTO submissions (username, image_id, transcription, audio_path, dialect, language, agreement_score, consensus_text, status, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (username, image_id, transcription_text, audio_url, dialect, language, 
             result.get("confidence", 0), transcription_text, status, datetime.now().isoformat())
        )
        
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

@app.get("/api/user/completed_stimuli/{username}")
def get_completed_stimuli(username: str, language: str, dialect: str):
    rows = execute_query(
        "SELECT DISTINCT image_id FROM submissions WHERE username = %s AND language = %s AND dialect = %s",
        (username, language, dialect)
    )
    return [row["image_id"] for row in rows]

@app.get("/api/admin/submissions")
def admin_submissions():
    return execute_query("SELECT * FROM submissions ORDER BY id DESC")

@app.get("/api/admin/users")
def admin_users():
    return execute_query("SELECT username, email, phone, fullname, location, language, dialect, points, solo_progress FROM users ORDER BY username ASC")

@app.post("/api/admin/verify")
def admin_verify(req: VerifyRequest):
    subs = execute_query("SELECT * FROM submissions WHERE id = %s", (req.submission_id,))
    if not subs:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    if req.consensus_text:
        execute_query(
            "UPDATE submissions SET status = %s, consensus_text = %s WHERE id = %s",
            (req.status, req.consensus_text, req.submission_id)
        )
    else:
        execute_query(
            "UPDATE submissions SET status = %s WHERE id = %s",
            (req.status, req.submission_id)
        )
    return {"message": "Submission verification updated successfully"}

@app.get("/api/health")
def health():
    return {
        "status": "Lexara backend is running",
        "database_mode": "PostgreSQL Cloud" if IS_POSTGRES else "Local SQLite",
        "audio_storage_mode": "Cloudinary" if IS_CLOUDINARY else "Supabase" if IS_SUPABASE_STORAGE else "Local static directory"
    }

@app.get("/api/leaderboard")
def get_leaderboard():
    # Fetch contribution count grouped by language & dialect for approved submissions
    results = execute_query(
        """SELECT language, dialect, COUNT(*) as contribution_count 
           FROM submissions 
           WHERE status = 'approved' 
           GROUP BY language, dialect 
           ORDER BY contribution_count DESC"""
    )
    return results or []

@app.get("/api/bridge/{image_id}")
def get_bridge_data(image_id: str):
    # Fetch all approved submissions for this image_id to allow dynamic dialect comparisons
    results = execute_query(
        """SELECT dialect, consensus_text, username 
           FROM submissions 
           WHERE image_id = %s AND status = 'approved'""",
        (image_id,)
    )
    return results or []

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
                for speaker, data_item in final_submissions.items():
                    if data_item["approved"]:
                        sub_obj = next((s for s in room_state["submissions"] if s["username"] == speaker), None)
                        if sub_obj:
                            execute_query(
                                """INSERT INTO submissions (username, image_id, transcription, audio_path, dialect, language, agreement_score, consensus_text, status, created_at)
                                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'approved', ?)""",
                                (speaker, room_state["stimulus_id"], sub_obj["text"], sub_obj["audio_url"], sub_obj["dialect"], room_state["language"], 
                                 100, data_item["text"], datetime.now().isoformat())
                            )
                            saved_count += 1
                
                # Check consensus points rewards:
                if saved_count > 0:
                    room_state["consensus_progress"] += 1
                    
                    if room_state["consensus_progress"] >= 3:
                        room_players = manager.get_room_players(room_id)
                        for p in room_players:
                            execute_query("UPDATE users SET points = points + 1 WHERE username = %s", (p["username"],))
                        
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