from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from google.genai import types
from pydantic import BaseModel
from typing import List, Dict
import cubeSolver

import json
import detect_cube as dc

app = FastAPI()

class CubeColors(BaseModel):
    front: List[str]
    back: List[str]
    left: List[str]
    right: List[str]
    top: List[str]
    bottom: List[str]

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

@app.post("/solve-cube")
def solveCube(colors: CubeColors):
    all_tiles = (
        colors.top +
        colors.left +
        colors.front +
        colors.right +
        colors.back +
        colors.bottom
    )
    cube_string = "".join(all_tiles)
    print(f"Received cube string: {cube_string}")
    result = cubeSolver.solveCube(cube_string)
    print(f"Result: {result}")
    response = {
        "ok": result[0],
        "solution": result[1] if result[0] else None,
        "error": result[1] if not result[0] else None,
    }
    return response

@app.post("/detect-cube")
async def detect_cube(face: str, image: UploadFile = File(...)):
  return await dc.detect_face_by_center(face, image)

app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="frontend")
