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


# In-memory store (resets when server restarts)
CUBE_FACES: dict[str, list[str]] = {}

VALID_FACES = {"U", "D", "F", "B", "L", "R"}
VALID_TILES = {"W", "G", "R", "Y", "B", "O", "?"}


@app.post("/detect-cube")
async def detect_cube(face: str, image: UploadFile = File(...)):
    """
    Upload ONE face image at a time.

    Call like:
      POST /detect-cube?face=F
      form-data: image=<file>

    Returns:
      - stored face tiles
      - missing faces
      - and when complete: cube_repr (54 chars) in order U+L+F+R+B+D
    """
    face = (face or "").strip().upper()
    if face not in VALID_FACES:
        raise HTTPException(status_code=400, detail="face must be one of U,D,F,B,L,R")

    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image")

    prompt = f"""
You are labeling the {face} face of a standard Rubik’s Cube from a photo.
You MUST label only that face and ignore others.

Color scheme:
U=W (White), F=G (Green), R=R (Red), D=Y (Yellow), B=B (Blue), L=O (Orange).

Return ONLY valid JSON:
{{
  "face": "{face}",
  "tiles": ["W|G|R|Y|B|O|?", "... 9 total"]
}}

Rules:
- 9 entries exactly, row-major order:
  [top-left, top-middle, top-right,
   middle-left, center, middle-right,
   bottom-left, bottom-middle, bottom-right]
- If a sticker is unclear, put "?".
- No guessing. No extra keys. No extra text. No markdown.
"""

    # Gemini call (assumes you already have: client = genai.Client())
    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=image.content_type),
                prompt,
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {e}")

    raw = (response.text or "").strip()
    if not raw:
        raise HTTPException(status_code=502, detail="Empty Gemini response")

    # Parse JSON from Gemini
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {"error": "Gemini did not return valid JSON", "raw": raw}

    # Validate Gemini output
    out_face = str(data.get("face", "")).strip().upper()
    tiles = data.get("tiles")

    if out_face != face:
        raise HTTPException(status_code=502, detail=f"Gemini returned face={out_face}, expected {face}")

    if not isinstance(tiles, list) or len(tiles) != 9:
        raise HTTPException(status_code=502, detail="Gemini tiles must be a list of length 9")

    tiles = [str(t).strip().upper() for t in tiles]
    if any(t not in VALID_TILES for t in tiles):
        raise HTTPException(status_code=502, detail="Tiles must be only W,G,R,Y,B,O,?")

    # Store this face
    CUBE_FACES[face] = tiles

    missing = sorted(list(VALID_FACES - set(CUBE_FACES.keys())))
    have = sorted(list(set(CUBE_FACES.keys())))

    # Build cube_repr if complete (and no "?")
    cube_repr = None
    if not missing:
        order = ["U", "L", "F", "R", "B", "D"]
        all_tiles = []
        for f in order:
            all_tiles.extend(CUBE_FACES[f])

        if "?" not in all_tiles:
            cube_repr = "".join(all_tiles)

    return {
        "stored_face": face,
        "tiles": tiles,
        "have": have,
        "missing": missing,
        "cube_repr": cube_repr,  # null until complete + no "?"
    }
