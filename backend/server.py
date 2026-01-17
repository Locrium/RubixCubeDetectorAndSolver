from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
import json

app = FastAPI()

# Allow frontend (Vite / React) to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini client (reads GEMINI_API_KEY from environment)
client = genai.Client()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/detect-cube")
async def detect_cube(image: UploadFile = File(...)):
    # Validate upload
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image")

    prompt = """
You are given an image of a Rubik's Cube.

Return ONLY valid JSON in the following schema:

{
  "faces": {
    "U": ["W","W","W","W","W","W","W","W","W"],
    "R": ["R","R","R","R","R","R","R","R","R"],
    "F": ["G","G","G","G","G","G","G","G","G"],
    "D": ["Y","Y","Y","Y","Y","Y","Y","Y","Y"],
    "L": ["O","O","O","O","O","O","O","O","O"],
    "B": ["B","B","B","B","B","B","B","B","B"]
  }
}

Rules:
- Use only letters: W R G Y O B
- Exactly 9 values per face
- No markdown, no explanations
- If unsure, use "?"
"""

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=image.content_type,
                ),
                prompt,
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {e}")

    raw = (response.text or "").strip()
    if not raw:
        raise HTTPException(status_code=502, detail="Empty Gemini response")

    # Try to parse JSON
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "error": "Gemini did not return valid JSON",
            "raw": raw,
        }
