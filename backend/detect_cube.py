from fastapi import UploadFile, HTTPException
from google.genai import types
import json
import os
from google import genai
from dotenv import load_dotenv
import os


CENTER_DETECTION_PROMPT = """
You are labeling ONE face of a standard Rubik’s Cube from a photo.

IMPORTANT:
- You MUST label only that face and ignore others.

Allowed letters:
W,G,R,Y,B,O,?  (Use "?" only if unclear.)

Return ONLY valid JSON:
{{
  "tiles": ["W|G|R|Y|B|O|?", "... 9 total"]
}}

Rules:
- 9 entries exactly, row-major order:
  [top-left, top-middle, top-right,
   middle-left, center, middle-right,
   bottom-left, bottom-middle, bottom-right]
- If a sticker is unclear, put "?" (but NOT for the center).
- No guessing. No extra keys. No extra text. No markdown.
"""


def rotate90Degrees(tiles):
    
    return [
        tiles[8], tiles[7], tiles[6],
        tiles[5], tiles[4], tiles[3],
        tiles[2], tiles[1], tiles[0],
    ]
    
VALID_CENTER_COLORS = {"W", "G", "R", "Y", "B", "O"}
VALID_TILES = {"W", "G", "R", "Y", "B", "O", "?"}


load_dotenv()  # reads .env into the environment

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in .env")

client = genai.Client(api_key=GEMINI_API_KEY)



async def detect_face_by_center(center: str, image: UploadFile):
    center = (center or "").strip().upper()

    if center not in VALID_CENTER_COLORS:
        return {
            "ok": False,
            "error": "Invalid center color selected.",
            "tiles": None,
            "detected_center": None,
        }

    if not image.content_type or not image.content_type.startswith("image/"):
        return {
            "ok": False,
            "error": "The uploaded file is not an image.",
            "tiles": None,
            "detected_center": None,
        }

    image_bytes = await image.read()
    if not image_bytes:
        return {
            "ok": False,
            "error": "The image file is empty.",
            "tiles": None,
            "detected_center": None,
        }

    prompt = CENTER_DETECTION_PROMPT

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=image.content_type
                ),
                prompt,
            ],
        )
    except Exception:
        return {
            "ok": False,
            "error": "Could not analyze the image. Please try again.",
            "tiles": None,
            "detected_center": None,
        }

    raw = (response.text or "").strip()
    if not raw:
        return {
            "ok": False,
            "error": f'The image could not be read clearly. response: {raw}',
            "tiles": None,
            "detected_center": None,
        }

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {
            "ok": False,
            "error": "The image was unclear or partially hidden.",
            "tiles": None,
            "detected_center": None,
        }

    tiles = data.get("tiles")
    if not isinstance(tiles, list) or len(tiles) != 9:
        return {
            "ok": False,
            "error": "The full face was not visible in the image.",
            "tiles": None,
            "detected_center": None,
        }

    tiles = [str(t).strip().upper() for t in tiles]
    if any(t not in VALID_TILES for t in tiles):
        return {
            "ok": False,
            "error": "The colors could not be identified reliably.",
            "tiles": None,
            "detected_center": None,
        }

    detected_center = tiles[4]

    if detected_center != center:
        return {
            "ok": False,
            "error": "The center sticker does not match the selected face.",
            "tiles": None,
            "detected_center": detected_center,
        }
    if(detected_center == "W" or detected_center == "Y"): 
        #tiles = rotate90Degrees(tiles)
        print("Rotated Counter-Clockwise")
    return {
        "ok": True,
        "error": None,
        "tiles": tiles,
        "detected_center": detected_center,
    }
