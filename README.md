# MC hacks 2026

Solve a rubiks using AI vision

## Tech Stack

- **Backend:** FastAPI  
- **Frontend:** React + Vite  
- **3D Cube Visualization:** cubing.js  
  https://js.cubing.net/cubing/
- **Cube Solving:** cube-solver  
  https://cube-solver.readthedocs.io/en/latest/cube_solver.html


## Prerequisites
* Python 3.12 or 3.13 is required
* Node.js


## Installing dependencies
Python: 
```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
Node.js:
```
cd frontend
npm install
```


## Building the frontend (dist)

The backend expects the `frontend/dist` folder to be built and present.

```
cd frontend
npm run build
```

## Backend env

Have the following in a `.env` file in the `backend` directory:
```
GEMINI_API_KEY=<your_gemini_api_key_here>
```

## Starting the appliation
```
cd backend
start_server.cmd

```
When server is live, go to http://127.0.0.1:8000.

## Running the frontend for development
```
cd frontend
npm run dev
```
