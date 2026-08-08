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
UPLOAD_DIR = pathlib.Path("uploads")
AUDIO_DIR = UPLOAD_DIR / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# Mount uploads folder to serve audio files statically
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

DB_PATH = "lexara_dataset.db"

# Database initialization
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create Users Table
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
    
    # Create Submissions Table
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
    
    # Add a default admin account
    cursor.execute("SELECT username FROM users WHERE username = 'vincent.chidiebere@outlook.com'")
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO users (username, password, language, dialect, points) VALUES (?, ?, ?, ?, ?)",
            ("vincent.chidiebere@outlook.com", "Vincent1993#", "Igbo", "Onitsha", 500)
        )
        
    conn.commit()
    conn.close()

init_db()

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
    status: str  # 'approved' or 'rejected'
    consensus_text: str = None


# Helpers to query database
def get_user(username: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    return user

def update_user_points_and_progress(username: str, points: int, progress: int):
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
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if username exists
    cursor.execute("SELECT username FROM users WHERE username = ?", (req.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")
        
    # Insert new user
    cursor.execute(
        "INSERT INTO users (username, password, language, dialect, points, solo_progress) VALUES (?, ?, ?, ?, 120, 0)",
        (req.username, req.password, req.language, req.dialect if req.dialect else None)
    )
    conn.commit()
    conn.close()
    return {"message": "Signup successful", "username": req.username}

@app.post("/api/login")
def login(req: LoginRequest):
    user = get_user(req.username)
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
    # Save audio file to uploads/audio
    file_ext = os.path.splitext(audio.filename)[1] if audio.filename else ".wav"
    file_name = f"{uuid.uuid4()}{file_ext}"
    saved_path = AUDIO_DIR / file_name
    
    with open(saved_path, "wb") as buffer:
        buffer.write(await audio.read())
        
    # Transcribe audio using validation script helper
    from validate_description import transcribe_audio
    try:
        text = transcribe_audio(str(saved_path))
    except Exception as e:
        # Cleanup file on error
        if saved_path.exists():
            saved_path.unlink()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
        
    return {
        "audio_url": f"/uploads/audio/{file_name}",
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
    audio_path = AUDIO_DIR / audio_file_name
    
    with open(audio_path, "wb") as buffer:
        buffer.write(await audio.read())

    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(image.filename)[1]) as tmp_image:
        tmp_image.write(await image.read())
        image_path = tmp_image.name

    try:
        # Load API keys and run validation
        from validate_description import validate_description
        result = validate_description(image_path, str(audio_path), language)
        
        # Pull player current state from db
        user = get_user(username)
        current_points = user["points"] if user else 120
        current_progress = user["solo_progress"] if user else 0
        
        points_earned = 0
        transcription_text = result.get("feedback_message", "") # Fallback
        
        # Verification criteria:
        # 1. Accept = True
        # 2. Confidence >= 80
        # 3. Minimum description length of 8 words
        raw_text = result.get("feedback_message", "")
        # ASR text is printed in validate_description, but the json response returns accept/confidence.
        # Let's get the exact transcribed text.
        # Since validate_description transcribes internally, let's extract it or use a default.
        # We can run transcribe_audio or look at validate_description output.
        # For validation endpoint, validate_description returns a dict with relevance, effort, etc.
        # We will parse the transcription word count. We can run transcribe_audio again or mock the count.
        # Actually, let's get the transcription text. To make it 100% robust, let's transcribe first:
        from validate_description import transcribe_audio
        try:
            transcription_text = transcribe_audio(str(audio_path))
        except Exception:
            transcription_text = "Spontaneous description recorded."
            
        word_count = len(transcription_text.split())
        
        # Hard threshold check:
        # 1. AI accept = true
        # 2. AI confidence >= 80
        # 3. Word count >= 8 words
        is_fully_valid = (
            result.get("accept", False) and 
            result.get("confidence", 0) >= 80 and 
            word_count >= 8
        )
        
        if is_fully_valid:
            # Increment progress towards coin (requires 10 verified descriptions to get 1 Coin)
            current_progress += 1
            if current_progress >= 10:
                points_earned = 1
                current_points += 1
                current_progress = 0
                
            # Store in database as approved automatically
            status = 'approved'
        else:
            status = 'pending'
            
        if user:
            update_user_points_and_progress(username, current_points, current_progress)
            
        # Save to submissions database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO submissions (username, image_id, transcription, audio_path, dialect, language, agreement_score, consensus_text, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (username, image_id, transcription_text, f"/uploads/audio/{audio_file_name}", dialect, language, 
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
        # Cleanup audio file on exception
        if audio_path.exists():
            audio_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp image file
        if os.path.exists(image_path):
            os.unlink(image_path)

@app.get("/api/admin/submissions")
def admin_submissions():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM submissions ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

@app.post("/api/admin/verify")
def admin_verify(req: VerifyRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if submission exists
    cursor.execute("SELECT * FROM submissions WHERE id = ?", (req.submission_id,))
    sub = cursor.fetchone()
    if not sub:
        conn.close()
        raise HTTPException(status_code=444, detail="Submission not found")
        
    # Update status and consensus text
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
    return {"status": "Lexara backend is running"}


# WEBSOCKETS MULTIPLAYER ENGINE

class ConnectionManager:
    def __init__(self):
        # active_connections[room_id] = list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # player_profiles[websocket] = { username, language, dialect }
        self.player_profiles: Dict[WebSocket, Dict[str, str]] = {}
        # rooms[room_id] = { host_username, language, consensus_progress, status, stimulus_id, submissions, votes }
        self.rooms: Dict[str, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, username: str, language: str, dialect: str):
        # Check Room Language / Tribe Constraint
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
        
        # Initialize room list if not present
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
            
        self.active_connections[room_id].append(websocket)
        self.player_profiles[websocket] = {
            "username": username,
            "language": language,
            "dialect": dialect
        }
        
        # Initialize room state if first player (Host)
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
        # Broadcast player joining event
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
                # A player has uploaded audio and received text transcription
                submission_details = {
                    "username": username,
                    "dialect": dialect,
                    "text": event["text"],
                    "audio_url": event["audio_url"]
                }
                
                # Append to room state submissions
                room_state["submissions"].append(submission_details)
                
                # Check if all players (except host if host is just selecting, or all connections) have submitted
                # For simplified logic: broadcast immediately as players submit
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
                # Platform owner / Host finishes validation voting, makes corrections, and commits
                # Loop through all submissions and commit approved ones to SQLite
                final_submissions = event["final_submissions"] # Dict of {username: {approved: bool, text: str}}
                
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                
                saved_count = 0
                for speaker, data_item in final_submissions.items():
                    if data_item["approved"]:
                        # Find corresponding submission from room_state
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
                
                # Check Consensus Rewards System:
                # Every 3 successful consensus submissions rewards 1 Coin to ALL players in the room each.
                if saved_count > 0:
                    room_state["consensus_progress"] += 1
                    
                    if room_state["consensus_progress"] >= 3:
                        # Award 1 Coin to all active players in room in database
                        room_players = manager.get_room_players(room_id)
                        
                        db_conn = sqlite3.connect(DB_PATH)
                        db_cursor = db_conn.cursor()
                        for p in room_players:
                            db_cursor.execute("UPDATE users SET points = points + 1 WHERE username = ?", (p["username"],))
                        db_conn.commit()
                        db_conn.close()
                        
                        # Reset progress
                        room_state["consensus_progress"] = 0
                        
                        await manager.broadcast(room_id, {
                            "type": "consensus_coin_awarded",
                            "message": "Consensus Threshold Cleared! +1 Coin awarded to all participants."
                        })
                
                # Reset room state for next card
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
        # Notify other players
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