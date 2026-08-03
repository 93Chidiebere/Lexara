from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import json
from validate_description import validate_description

app = FastAPI()

# Allow Lovable frontend to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/validate")
async def validate(
    audio: UploadFile = File(...),
    image: UploadFile = File(...),
    language: str = Form(...),
    username: str = Form(...),
    image_id: str = Form(...)
):
    # Save uploaded files temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio.filename)[1]) as tmp_audio:
        tmp_audio.write(await audio.read())
        audio_path = tmp_audio.name

    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(image.filename)[1]) as tmp_image:
        tmp_image.write(await image.read())
        image_path = tmp_image.name

    try:
        result = validate_description(image_path, audio_path, language)

        # Map confidence to points earned
        points_earned = 0
        if result["accept"]:
            if result["confidence"] >= 80:
                points_earned = 10
            elif result["confidence"] >= 50:
                points_earned = 5

        return {
            "confidence": result["confidence"],
            "accept": result["accept"],
            "feedback_message": result["feedback_message"],
            "points_earned": points_earned,
            "language_detected": result["language_detected"]
        }

    finally:
        # Clean up temp files
        os.unlink(audio_path)
        os.unlink(image_path)


@app.get("/api/health")
def health():
    return {"status": "Lexara backend is running"}