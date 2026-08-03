import os
import requests
import json
import pathlib
import base64

# Load environment variables from .env
def load_dotenv():
    env_path = pathlib.Path(__file__).parent / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            key, _, val = line.partition("=")
            os.environ[key.strip()] = val.strip().strip('"').strip("'")

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")


def transcribe_audio(audio_path):
    """Step 1: Transcribe audio to text using a free speech-to-text service."""
    import urllib.request
    import tempfile
    import os

    # Use Groq's free Whisper API for transcription loaded from environment or .env
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        raise Exception("GROQ_API_KEY is not set in environment or .env file")

    audio_bytes = pathlib.Path(audio_path).read_bytes()
    audio_ext = pathlib.Path(audio_path).suffix.lower().lstrip(".")

    response = requests.post(
        url="https://api.groq.com/openai/v1/audio/transcriptions",
        headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
        files={"file": (pathlib.Path(audio_path).name, audio_bytes, f"audio/{audio_ext}")},
        data={"model": "whisper-large-v3", "response_format": "json"}
    )

    result = response.json()
    if "text" not in result:
        print("Transcription error:", json.dumps(result, indent=2))
        raise Exception("Transcription failed")

    return result["text"]


def validate_description(image_path, audio_path, expected_language):

    # Step 1 — Transcribe audio
    print("Transcribing audio...")
    transcription = transcribe_audio(audio_path)
    print(f"Transcription: {transcription}")

    # Step 2 — Validate transcription + image together
    image_data = base64.b64encode(pathlib.Path(image_path).read_bytes()).decode()

    image_ext = pathlib.Path(image_path).suffix.lower()
    image_mime = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png"
    }.get(image_ext, "image/jpeg")

    prompt = f"""
    You are a language data validation engine for a crowdsourced
    audio description collection app.

    The player selected language: {expected_language}.
    The player's spoken description was transcribed as: "{transcription}"

    Evaluate whether this transcribed description matches the image provided.
    Penalize heavily if the transcription appears to be in a language 
    other than {expected_language}.

    Evaluate on these dimensions:

    1. RELEVANCE (0-10): Does the description refer to the object in the image?
       Look for mentions of the object's category, function, shape, color,
       material, or context.

    2. EFFORT (0-10): Is this a genuine attempt at description?
       Penalize: one-word answers, silence, unrelated speech.

    3. LANGUAGE_DETECTED: What language is the transcription in?
       Be specific — "Igbo", "Hausa", "Yoruba", "Twi", "English" etc.
       If uncertain, say "uncertain".

    4. CONFIDENCE (0-100): Overall confidence this is a valid usable description.
       - 80-100: Accept, reward player fully
       - 50-79: Accept provisionally, prompt player to add detail
       - 20-49: Weak submission, ask player to try again
       - 0-19: Reject, likely irrelevant or empty

    5. FEEDBACK_MESSAGE: Short encouraging game message, max 12 words.
       Never reveal the scoring mechanism.

    Return ONLY valid JSON, no markdown, no preamble:

    {{
      "relevance": <0-10>,
      "effort": <0-10>,
      "language_detected": "<language name>",
      "confidence": <0-100>,
      "feedback_message": "<message>",
      "accept": <true or false>
    }}
    """

    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model":"openrouter/auto",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{image_mime};base64,{image_data}"}
                        }
                    ]
                }
            ]
        }
    )

    data = response.json()

    if "choices" not in data:
        print("API Error:", json.dumps(data, indent=2))
        raise Exception("No choices in response — see error above")

    raw = data["choices"][0]["message"]["content"].strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    return json.loads(raw)


if __name__ == "__main__":
    result = validate_description("cup.jpg", "description.wav", "Igbo")
    print(json.dumps(result, indent=2))