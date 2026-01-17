
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# example of an endpoint. both processPhoto and SolveCube must pe POST methods
'''@app.post("/api/getMove")
def getMove(request : int):
'''
   



frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"

app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="frontend")


print("server running on http://127.0.0.1:8000")


