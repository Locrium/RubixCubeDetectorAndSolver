from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from google.genai import types

import json
import detect_cube as dc

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




@app.get("/health")
def health():
    return {"ok": True}




@app.post("/detect-cube")
async def detect_cube(face: str, image: UploadFile = File(...)):
  return await dc.detect_face_by_center(face, image)

app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="frontend")
